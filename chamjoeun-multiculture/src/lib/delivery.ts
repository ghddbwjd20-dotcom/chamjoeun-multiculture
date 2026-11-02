import { randomUUID, randomBytes, createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { channelConfigured,normalizePhone,retryDelay,sendingEnabled,type DeliveryChannel,type DeliveryEnv } from "./delivery-policy.ts";
import { dispatchDelivery,DeliveryError,type DeliveryMessage } from "./delivery-providers.ts";

export async function queueDelivery(client:PoolClient,input:{userId?:string|null;recipient?:string;channel?:DeliveryChannel;subject:string;body:string;payload?:Record<string,unknown>;dedupeKey?:string;marketing?:boolean;newsletterId?:string}) {
  const channel=input.channel??"email";
  const result=await client.query(`INSERT INTO delivery_jobs(user_id,recipient,channel,subject,body,payload,dedupe_key,marketing,newsletter_id,status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING RETURNING id`,
    [input.userId??null,input.recipient??"",channel,input.subject,input.body,JSON.stringify(input.payload??{}),input.dedupeKey??null,input.marketing??false,input.newsletterId??null,sendingEnabled()&&channelConfigured(channel)?"queued":"awaiting_configuration"]);
  return result.rows[0]?.id as string|undefined;
}
export async function notifyMember(client:PoolClient,userId:string,title:string,body:string,href:string,dedupeKey:string) {
  const job=await queueDelivery(client,{userId,subject:title,body,dedupeKey});
  if(job)await client.query("INSERT INTO notifications(user_id,title,body,href) VALUES($1,$2,$3,$4)",[userId,title,body,href]);
  const subscriptions=await client.query("SELECT id FROM push_subscriptions WHERE user_id=$1",[userId]);
  for(const sub of subscriptions.rows)await queueDelivery(client,{userId,channel:"push",subject:title,body,payload:{subscriptionId:sub.id,href},dedupeKey:`${dedupeKey}:push:${sub.id}`});
}
export async function queueNewsletter(client:PoolClient,id:string,actorId:string) {
  const newsletter=(await client.query("SELECT * FROM newsletters WHERE id=$1 FOR UPDATE",[id])).rows[0];
  if(!newsletter||newsletter.status!=="draft")return {error:"발송 예약 전의 초안을 선택해 주세요."};
  const users=await client.query("SELECT id FROM users WHERE marketing_consent=true AND email_verified_at IS NOT NULL AND deleted_at IS NULL ORDER BY id");
  if(!users.rows.length)return {error:"교육·사업 소식 이메일 수신에 동의한 회원이 없습니다."};
  for(const user of users.rows) {
    const token=randomBytes(32).toString("hex");
    await client.query("INSERT INTO unsubscribe_tokens(token_hash,user_id) VALUES($1,$2)",[createHash("sha256").update(token).digest("hex"),user.id]);
    await queueDelivery(client,{userId:user.id,subject:newsletter.subject,body:newsletter.body,marketing:true,newsletterId:id,payload:{unsubscribeToken:token},dedupeKey:`newsletter:${id}:${user.id}`});
  }
  await client.query("UPDATE newsletters SET status='queued',queued_at=now() WHERE id=$1",[id]);
  await client.query("INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,'뉴스레터 발송 예약',$2,$3)",[actorId,id,JSON.stringify({recipients:users.rows.length})]);
  return {count:users.rows.length};
}
export async function unsubscribeNewsletter(db:Pool,token:string) {
  if(!/^[a-f0-9]{64}$/.test(token))return;
  const client=await db.connect();
  try {await client.query("BEGIN");const user=(await client.query("SELECT user_id FROM unsubscribe_tokens WHERE token_hash=$1",[createHash("sha256").update(token).digest("hex")])).rows[0];
    if(user){await client.query("UPDATE users SET marketing_consent=false WHERE id=$1",[user.user_id]);await client.query("UPDATE delivery_jobs SET status='cancelled',last_error='이메일 수신 동의 해제',updated_at=now() WHERE user_id=$1 AND marketing=true AND status IN ('queued','awaiting_configuration')",[user.user_id]);}
    await client.query("COMMIT");
  } catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
}
export async function recoverDeliveries(db:Pool) {
  await db.query("UPDATE delivery_jobs SET status='failed',last_error='처리가 중단되었습니다. 제공업체 접수 내역 확인 후 재처리해 주세요.',lock_token=NULL,locked_at=NULL,updated_at=now() WHERE status='processing' AND locked_at<now()-interval '10 minutes'");
}
export async function processDelivery(db:Pool,options:{env?:DeliveryEnv;send?:typeof dispatchDelivery}={}) {
  const env=options.env??process.env;
  if(!sendingEnabled(env))return false;
  const client=await db.connect();
  let job:Record<string,unknown>|undefined;
  try {
    await client.query("BEGIN");
    job=(await client.query("SELECT * FROM delivery_jobs WHERE status IN ('queued','awaiting_configuration') AND next_attempt_at<=now() AND attempts<5 ORDER BY next_attempt_at,created_at FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];
    if(!job){await client.query("COMMIT");return false;}
    const id=String(job.id),channel=job.channel as DeliveryChannel;
    if(!channelConfigured(channel,env)) {await client.query("UPDATE delivery_jobs SET status='awaiting_configuration',next_attempt_at=now()+interval '1 hour',updated_at=now() WHERE id=$1",[id]);await client.query("COMMIT");return true;}
    const user=job.user_id?(await client.query("SELECT email,phone,marketing_consent,deleted_at,email_verified_at FROM users WHERE id=$1",[job.user_id])).rows[0]:null;
    const cancel=async(reason:string)=>{await client.query("UPDATE delivery_jobs SET status='cancelled',last_error=$1,updated_at=now() WHERE id=$2",[reason,id]);await client.query("COMMIT");return true;};
    if(job.user_id&&(!user||user.deleted_at))return await cancel("탈퇴한 회원");
    if(job.marketing&&(!user?.marketing_consent||!user.email_verified_at))return await cancel("이메일 수신 동의 또는 인증이 해제되었습니다.");
    const payload={...(job.payload as Record<string,unknown>)};
    if(channel==="push") {const sub=(await client.query("SELECT subscription FROM push_subscriptions WHERE id=$1 AND user_id=$2",[payload.subscriptionId,job.user_id])).rows[0];if(!sub)return await cancel("브라우저 알림 구독이 해제되었습니다.");payload.subscription=sub.subscription;}
    const recipient=String(job.recipient||(channel==="email"?user?.email:channel==="push"?"push":normalizePhone(user?.phone??""))||"");
    if(!recipient)return await cancel("발송에 필요한 수신 정보가 없습니다.");
    const token=randomUUID();
    job={...job,payload,recipient,lock_token:token,attempts:Number(job.attempts)+1};
    await client.query("UPDATE delivery_jobs SET status='processing',recipient=$1,attempts=attempts+1,locked_at=now(),lock_token=$2,updated_at=now() WHERE id=$3",[recipient,token,id]);
    await client.query("COMMIT");
  } catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  const id=String(job!.id),lock=String(job!.lock_token);
  try {
    const providerId=await(options.send??dispatchDelivery)(job as unknown as DeliveryMessage,env);
    await db.query("UPDATE delivery_jobs SET status='sent',provider_id=$1,sent_at=now(),last_error=NULL,locked_at=NULL,lock_token=NULL,updated_at=now() WHERE id=$2 AND lock_token=$3 AND status='processing'",[providerId,id,lock]);
  } catch(error) {
    const failure=error instanceof DeliveryError?error:new DeliveryError("발송 처리 결과 확인이 필요합니다.",false,true);
    const withinWindow=Date.now()-new Date(String(job!.created_at)).getTime()<23*3600*1000;
    const retry=failure.retryable&&Number(job!.attempts)<5&&(job!.channel!=="email"||withinWindow);
    await db.query("UPDATE delivery_jobs SET status=$1,last_error=$2,next_attempt_at=now()+($3*interval '1 second'),locked_at=NULL,lock_token=NULL,updated_at=now() WHERE id=$4 AND lock_token=$5 AND status='processing'",[retry?"queued":"failed",failure.message,retryDelay(Number(job!.attempts)),id,lock]);
    if(failure.expiredSubscription)await db.query("DELETE FROM push_subscriptions WHERE id=$1 AND user_id=$2",[(job!.payload as Record<string,unknown>).subscriptionId,job!.user_id]);
  }
  return true;
}

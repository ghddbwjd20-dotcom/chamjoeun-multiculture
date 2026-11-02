"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { queueDelivery,queueNewsletter } from "@/lib/delivery";
import type { FormState } from "@/components/form";
export async function saveNewsletter(_:FormState,form:FormData):Promise<FormState> {
  const admin=await requireAdmin();
  const parsed=z.object({subject:z.string().trim().min(2).max(150),body:z.string().trim().min(10).max(20000)}).safeParse(Object.fromEntries(form));
  if(!parsed.success)return {error:"제목과 10자 이상의 내용을 입력해 주세요."};
  await transaction(async client=>{const result=await client.query("INSERT INTO newsletters(subject,body,created_by) VALUES($1,$2,$3) RETURNING id",[parsed.data.subject,parsed.data.body,admin.id]);await client.query("INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'뉴스레터 초안 저장',$2)",[admin.id,result.rows[0].id]);});
  revalidatePath("/admin/deliveries");return {success:"초안을 저장했습니다. 대상 수를 확인한 뒤 별도로 발송 예약해 주세요."};
}
export async function scheduleNewsletter(_:FormState,form:FormData):Promise<FormState> {
  const admin=await requireAdmin();const id=String(form.get("id")??"");
  if(!z.uuid().safeParse(id).success||form.get("confirm")!=="on")return {error:"초안과 수신 동의 대상 발송 안내를 확인해 주세요."};
  const result=await transaction(client=>queueNewsletter(client,id,admin.id));
  revalidatePath("/admin/deliveries");return result.error?{error:result.error}:{success:`${result.count}명에게 발송 예약했습니다. 발송 설정과 작업자 실행이 완료되면 처리됩니다.`};
}
export async function manageDelivery(_:FormState,form:FormData):Promise<FormState> {
  const admin=await requireAdmin();const p=z.object({id:z.uuid(),operation:z.enum(["retry","cancel"])}).safeParse(Object.fromEntries(form));
  if(!p.success)return {error:"발송 작업을 확인해 주세요."};
  if(p.data.operation==="retry"&&form.get("reviewed")!=="on")return {error:"제공업체 접수 내역과 중복 발송 가능성을 확인해 주세요."};
  const changed=await transaction(async client=>{
    const sql=p.data.operation==="retry"?
      "UPDATE delivery_jobs SET status='queued',attempts=0,generation=generation+1,next_attempt_at=now(),last_error=NULL,updated_at=now() WHERE id=$1 AND status IN ('failed','awaiting_configuration') RETURNING id":
      "UPDATE delivery_jobs SET status='cancelled',last_error='관리자 발송 취소',updated_at=now() WHERE id=$1 AND status IN ('queued','awaiting_configuration','failed') RETURNING id";
    const result=await client.query(sql,[p.data.id]);if(!result.rows[0])return false;
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,$2,$3)",[admin.id,p.data.operation==="retry"?"발송 재처리 예약":"발송 예약 취소",p.data.id]);return true;
  });revalidatePath("/admin/deliveries");return changed?{success:"발송 상태를 갱신했습니다."}:{error:"처리 중이거나 이미 종료된 작업입니다."};
}
export async function queueServiceNotice(_:FormState,form:FormData):Promise<FormState> {
  const admin=await requireAdmin();const p=z.object({userId:z.uuid(),channel:z.enum(["email","sms","alimtalk","push"]),subject:z.string().trim().min(2).max(100),body:z.string().trim().min(5).max(1000),variables:z.string().max(3000)}).safeParse(Object.fromEntries(form));
  if(!p.success||form.get("serviceOnly")!=="on")return {error:"수신 회원·내용과 운영 안내 발송 목적을 확인해 주세요."};
  let variables:Record<string,string>={};
  if(p.data.channel==="alimtalk")try{variables=z.record(z.string().regex(/^#\{[^}]+\}$/),z.string().max(500)).parse(JSON.parse(p.data.variables||"{}"));}catch{return {error:"알림톡 승인 템플릿의 변수와 값을 JSON 형식으로 입력해 주세요."};}
  const result=await transaction(async client=>{
    const user=(await client.query("SELECT id FROM users WHERE id=$1 AND deleted_at IS NULL",[p.data.userId])).rows[0];if(!user)return false;
    if(p.data.channel==="push") {
      const subscriptions=await client.query("SELECT id FROM push_subscriptions WHERE user_id=$1",[user.id]);if(!subscriptions.rows.length)return false;
      for(const sub of subscriptions.rows)await queueDelivery(client,{userId:user.id,channel:"push",subject:p.data.subject,body:p.data.body,payload:{subscriptionId:sub.id,href:"/notifications"}});
    }else await queueDelivery(client,{userId:user.id,channel:p.data.channel,subject:p.data.subject,body:p.data.body,payload:{variables}});
    await client.query("INSERT INTO notifications(user_id,title,body) VALUES($1,$2,$3)",[user.id,p.data.subject,p.data.body]);
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,'회원 운영 안내 예약',$2,$3)",[admin.id,user.id,JSON.stringify({channel:p.data.channel})]);return true;
  });revalidatePath("/admin/deliveries");return result?{success:"운영 안내를 예약했습니다. 설정 전에는 실제 발송하지 않습니다."}:{error:"회원 또는 해당 브라우저 알림 구독을 확인해 주세요."};
}

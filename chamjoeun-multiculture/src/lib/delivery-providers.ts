import { createHmac,randomBytes } from "node:crypto";
import { allowedPushEndpoint, safeInternalHref, type DeliveryChannel, type DeliveryEnv } from "./delivery-policy.ts";
export class DeliveryError extends Error {
  constructor(message:string,public retryable=false,public uncertain=false,public expiredSubscription=false) { super(message); }
}
export type DeliveryMessage = { id:string;generation:number;channel:DeliveryChannel;recipient:string;subject:string;body:string;payload:Record<string,unknown> };
export async function dispatchDelivery(message:DeliveryMessage,env:DeliveryEnv=process.env,http:typeof fetch=fetch):Promise<string> {
  const key=`delivery-${message.id}-${message.generation}`;
  if(message.channel==="push") {
    const subscription=message.payload.subscription as {endpoint:string;keys:{p256dh:string;auth:string}};
    if(!subscription||!allowedPushEndpoint(subscription.endpoint)) throw new DeliveryError("브라우저 알림 수신 주소가 유효하지 않습니다.");
    const {default:webpush}=await import("web-push");
    try { await webpush.sendNotification(subscription,JSON.stringify({title:message.subject,body:message.body.slice(0,300),url:safeInternalHref(String(message.payload.href??"/notifications"))}),{TTL:3600,timeout:15000,vapidDetails:{subject:env.VAPID_SUBJECT!,publicKey:env.VAPID_PUBLIC_KEY!,privateKey:env.VAPID_PRIVATE_KEY!}});return key; }
    catch(error) { const status=(error as {statusCode?:number}).statusCode;throw new DeliveryError(`브라우저 알림 접수 실패 (${status??"연결 오류"})`,status===429,false,status===404||status===410); }
  }
  let url:string,headers:Record<string,string>,body:unknown;
  if(message.channel==="email") {
    const token=message.payload.unsubscribeToken;
    let text=message.body;let extra:Record<string,string>|undefined;
    if(typeof token==="string") {
      const link=new URL(`/unsubscribe?token=${token}`,env.APP_URL).href;
      const oneClick=new URL(`/api/unsubscribe?token=${token}`,env.APP_URL).href;
      text+=`\n\n교육·사업 소식 이메일 수신거부: ${link}`;
      extra={"List-Unsubscribe":`<${oneClick}>`,"List-Unsubscribe-Post":"List-Unsubscribe=One-Click"};
    }
    url="https://api.resend.com/emails";headers={Authorization:`Bearer ${env.RESEND_API_KEY}`,"Idempotency-Key":key,"Content-Type":"application/json"};
    body={from:env.MAIL_FROM,to:message.recipient,subject:message.subject,text,...(extra?{headers:extra}:{})};
  } else {
    const date=new Date().toISOString(),salt=randomBytes(24).toString("hex");
    const signature=createHmac("sha256",env.SOLAPI_API_SECRET!).update(date+salt).digest("hex");
    headers={Authorization:`HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,"Content-Type":"application/json"};
    url="https://api.solapi.com/messages/v4/send-many/detail";
    const msg:Record<string,unknown>={to:message.recipient,customFields:{deliveryJobId:message.id}};
    if(message.channel==="sms")Object.assign(msg,{from:env.SOLAPI_SENDER,text:message.body,autoTypeDetect:true});
    else Object.assign(msg,{type:"ATA",kakaoOptions:{pfId:env.SOLAPI_PFID,templateId:env.SOLAPI_ALIMTALK_TEMPLATE_ID,disableSms:true,variables:message.payload.variables??{}}});
    body={messages:[msg],strict:true,allowDuplicates:false};
  }
  let response:Response;
  try {response=await http(url,{method:"POST",headers,body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});}
  catch{throw new DeliveryError("접수 응답을 받지 못했습니다. 제공업체 발송 내역을 확인해 주세요.",message.channel==="email",true);}
  if(!response.ok)throw new DeliveryError(`제공업체 접수 실패 (${response.status})`,response.status===429||(message.channel==="email"&&response.status>=500),response.status>=500);
  let result:Record<string,unknown>;
  try{result=await response.json();}catch{throw new DeliveryError("접수 응답 형식 확인이 필요합니다.",message.channel==="email",true);}
  if(message.channel==="email") {if(typeof result.id!=="string")throw new DeliveryError("이메일 접수번호가 없습니다.",true,true);return result.id;}
  const failures=result.failedMessageList;
  if(Array.isArray(failures)&&failures.length)throw new DeliveryError("문자·알림톡 접수가 거절되었습니다. 수신번호와 승인 템플릿을 확인해 주세요.");
  const group=result.groupInfo as {groupId?:string;count?:{registeredSuccess?:number}}|undefined;
  if(!group?.groupId||group.count?.registeredSuccess===0)throw new DeliveryError("문자·알림톡 접수번호가 없습니다. 제공업체 내역을 확인해 주세요.",false,true);
  return group.groupId;
}

export type DeliveryChannel = "email" | "sms" | "alimtalk" | "push";
export type DeliveryEnv = Record<string, string | undefined>;
export const channelLabels = { email: "이메일", sms: "문자", alimtalk: "알림톡", push: "브라우저 알림" };
export const deliveryLabels: Record<string,string> = { queued:"발송 대기",processing:"처리 중",sent:"발송 접수",failed:"확인 필요",awaiting_configuration:"설정 대기",cancelled:"발송 제외" };
export function sendingEnabled(env:DeliveryEnv=process.env) { return env.NOTIFICATION_SENDING_ENABLED === "true"; }
export function channelConfigured(channel:DeliveryChannel,env:DeliveryEnv=process.env) {
  const required:Record<DeliveryChannel,string[]> = {
    email:["RESEND_API_KEY","MAIL_FROM"], sms:["SOLAPI_API_KEY","SOLAPI_API_SECRET","SOLAPI_SENDER"],
    alimtalk:["SOLAPI_API_KEY","SOLAPI_API_SECRET","SOLAPI_PFID","SOLAPI_ALIMTALK_TEMPLATE_ID"],
    push:["VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY","VAPID_SUBJECT"],
  };
  return required[channel].every(key=>Boolean(env[key]));
}
export function retryDelay(attempt:number) { return Math.min(3600,60*2**Math.max(0,attempt-1)); }
export function normalizePhone(value:string) {
  let digits=value.replace(/[^\d+]/g,"");
  if(digits.startsWith("+82")) digits="0"+digits.slice(3);
  return /^0\d{8,10}$/.test(digits)?digits:null;
}
export function safeInternalHref(value:string) { return /^\/(?!\/)[^\\\r\n]*$/.test(value)?value:"/notifications"; }
export function allowedPushEndpoint(value:string) {
  try { const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&(!u.port||u.port==="443")&&!u.hash&&
    (u.hostname==="fcm.googleapis.com"||u.hostname==="updates.push.services.mozilla.com"||u.hostname==="web.push.apple.com"||u.hostname.endsWith(".notify.windows.com")); } catch{return false;}
}

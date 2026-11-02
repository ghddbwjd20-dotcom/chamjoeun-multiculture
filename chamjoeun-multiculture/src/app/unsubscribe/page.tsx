import { PageHeading } from "@/components/page-heading";
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const token=(await searchParams).token??"";const valid=/^[a-f0-9]{64}$/.test(token);
  return <><PageHeading eyebrow="EMAIL PREFERENCES" title="소식 이메일 수신거부" description="교육·사업 소식 이메일 수신을 중단할 수 있습니다. 수강·결제 등 필수 운영 안내는 별도입니다."/><div className="container content">{valid?<form method="post" action={`/api/unsubscribe?token=${token}`}><p>아래 버튼을 누르면 이후 소식 이메일 발송 대상에서 제외됩니다.</p><button className="button primary" style={{marginTop:20}}>소식 이메일 수신거부</button></form>:<p>메일에서 받은 수신거부 주소를 확인해 주세요.</p>}</div></>;
}

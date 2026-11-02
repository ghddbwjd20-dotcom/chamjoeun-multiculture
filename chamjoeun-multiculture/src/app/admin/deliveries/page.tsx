import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/form";
import { channelLabels,deliveryLabels,sendingEnabled } from "@/lib/delivery-policy";
import { saveNewsletter,scheduleNewsletter,manageDelivery,queueServiceNotice } from "./actions";
export default async function Page({searchParams}:{searchParams:Promise<{status?:string;page?:string}>}) {
  await requireAdmin();const params=await searchParams;const status=Object.hasOwn(deliveryLabels,params.status??"")?params.status!:"";
  const requested=Number(params.page??1);const page=Number.isSafeInteger(requested)&&requested>0?Math.min(requested,100000):1;
  const jobs=await query("SELECT j.id,j.channel,j.subject,j.status,j.attempts,j.last_error,j.created_at,j.sent_at,j.next_attempt_at,coalesce(nullif(j.recipient,''),u.email,'수신정보 없음') recipient FROM delivery_jobs j LEFT JOIN users u ON u.id=j.user_id WHERE ($1='' OR j.status=$1) ORDER BY j.created_at DESC,j.id DESC LIMIT 31 OFFSET $2",[status,(page-1)*30]);
  const users=await query("SELECT id,name,email FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 200");
  const [count]=await query("SELECT count(*)::int count FROM users WHERE marketing_consent=true AND email_verified_at IS NOT NULL AND deleted_at IS NULL");
  const newsletters=await query("SELECT n.*,count(j.id)::int recipients FROM newsletters n LEFT JOIN delivery_jobs j ON j.newsletter_id=n.id GROUP BY n.id ORDER BY n.created_at DESC LIMIT 20");
  return <>
    <h2 className="section-title">알림·뉴스레터·발송 이력</h2>
    <p className="alert">외부 발송 {sendingEnabled()?"활성":"비활성"} · 발송 접수는 제공업체가 요청을 받았다는 뜻입니다. 실제 수신 결과는 제공업체 내역에서 확인하세요. <Link href="/admin/integrations">연동 상태 확인 →</Link></p>
    <div className="split" style={{marginTop:24}}>
      <section className="info-card"><h3>뉴스레터 초안</h3><p className="muted">현재 이메일 수신 동의·인증 완료 회원 {count.count}명. 초안 저장만으로 발송하지 않습니다.</p>
        <ActionForm action={saveNewsletter} label="초안 저장"><label>제목<input name="subject" required minLength={2} maxLength={150}/></label><label>내용<textarea name="body" required minLength={10} maxLength={20000}/></label></ActionForm>
      </section>
      <section className="info-card"><h3>회원 운영 안내</h3><ActionForm action={queueServiceNotice} label="운영 안내 예약">
        <label>수신 회원<select name="userId" required><option value="">선택해 주세요</option>{users.map(user=><option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
        <label>전달 방법<select name="channel">{Object.entries(channelLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>제목<input name="subject" required minLength={2} maxLength={100}/></label><label>내용<textarea name="body" required minLength={5} maxLength={1000}/></label>
        <label>알림톡 템플릿 변수 (알림톡만 사용)<textarea name="variables" defaultValue="{}" maxLength={3000}/></label>
        <label className="checkbox"><input type="checkbox" name="serviceOnly" required/><span>수강·문의 등 운영 안내입니다. 홍보 이메일은 수신 동의 회원 대상 뉴스레터를 이용합니다.</span></label>
      </ActionForm></section>
    </div>
    <h3 className="section-title" style={{marginTop:40}}>뉴스레터 목록</h3><div className="stack">{newsletters.map(newsletter=><section className="info-card" key={newsletter.id}><span className="badge">{{draft:"초안",queued:"예약 완료",cancelled:"취소"}[newsletter.status as "draft"|"queued"|"cancelled"]}</span><h3>{newsletter.subject}</h3><details><summary>내용 보기</summary><p style={{whiteSpace:"pre-wrap"}}>{newsletter.body}</p></details><p className="muted">발송 대상 {newsletter.recipients}명</p>{newsletter.status==="draft"&&<ActionForm action={scheduleNewsletter} label="동의 회원에게 발송 예약"><input type="hidden" name="id" value={newsletter.id}/><label className="checkbox"><input type="checkbox" name="confirm" required/><span>현재 수신 동의한 인증 회원 {count.count}명에게 예약합니다. 발송 직전에도 동의를 다시 확인합니다.</span></label></ActionForm>}</section>)}</div>
    <h3 className="section-title" style={{marginTop:40}}>발송 이력</h3><nav className="section-links"><Link href="/admin/deliveries">전체</Link>{Object.entries(deliveryLabels).map(([key,label])=><Link key={key} href={`/admin/deliveries?status=${key}`}>{label}</Link>)}</nav>
    <div className="stack">{jobs.slice(0,30).map(job=><section className="info-card" key={job.id}><span className="badge">{channelLabels[job.channel as keyof typeof channelLabels]} · {deliveryLabels[job.status]}</span><h3>{job.subject}</h3><p className="muted">{job.recipient} · 시도 {job.attempts}회 · {new Date(job.created_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</p>{job.last_error&&<p className="alert">{job.last_error}</p>}{["failed","awaiting_configuration"].includes(job.status)&&<ActionForm action={manageDelivery} label="발송 재처리 예약"><input name="id" type="hidden" value={job.id}/><input name="operation" type="hidden" value="retry"/><label className="checkbox"><input name="reviewed" type="checkbox" required/><span>제공업체 접수 내역을 확인했습니다. 이미 접수된 메시지를 재처리하면 중복 발송될 수 있습니다.</span></label></ActionForm>}{["queued","awaiting_configuration","failed"].includes(job.status)&&<ActionForm action={manageDelivery} label="발송 예약 취소"><input name="id" type="hidden" value={job.id}/><input name="operation" type="hidden" value="cancel"/></ActionForm>}</section>)}{!jobs.length&&<p className="muted">발송 이력이 없습니다.</p>}</div>
    <nav className="section-links" style={{marginTop:24}}>{page>1&&<Link href={`/admin/deliveries?status=${status}&page=${page-1}`}>이전</Link>}<span>{page}페이지</span>{jobs.length>30&&<Link href={`/admin/deliveries?status=${status}&page=${page+1}`}>다음</Link>}</nav>
  </>;
}

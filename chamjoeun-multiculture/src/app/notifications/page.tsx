import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { safeInternalHref } from "@/lib/delivery-policy";
import { PageHeading } from "@/components/page-heading";
import { markNotificationsRead } from "./actions";
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const user=await requireUser();const raw=Number((await searchParams).page??1);const page=Number.isSafeInteger(raw)&&raw>0?Math.min(raw,100000):1;
  const rows=await query("SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $2",[user.id,(page-1)*20]);
  return <><PageHeading eyebrow="NOTIFICATIONS" title="내 알림" description="수강·결제·문의 답변과 발급 안내를 확인합니다."/><div className="container content"><nav className="section-links"><Link href="/classroom">나의 강의실</Link><Link href="/mypage">마이페이지</Link><form action={markNotificationsRead}><button className="text-link">모두 읽음</button></form></nav><div className="stack">{rows.slice(0,20).map(row=><section className="info-card" key={row.id}><span className="badge">{row.read_at?"읽음":"새 알림"}</span><h2 style={{marginTop:12}}>{row.title}</h2><p style={{whiteSpace:"pre-wrap",marginTop:12}}>{row.body}</p><p className="muted">{new Date(row.created_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</p><div className="section-links"><Link href={safeInternalHref(row.href)}>내용 확인 →</Link>{!row.read_at&&<form action={markNotificationsRead}><input name="id" type="hidden" value={row.id}/><button className="text-link">읽음 표시</button></form>}</div></section>)}{!rows.length&&<p className="muted">받은 알림이 없습니다.</p>}</div><nav className="section-links" style={{marginTop:24}}>{page>1&&<Link href={`/notifications?page=${page-1}`}>이전</Link>}<span>{page}페이지</span>{rows.length>20&&<Link href={`/notifications?page=${page+1}`}>다음</Link>}</nav></div></>;
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="통합 운영관리"
        description="회원, 교육과정과 기관 콘텐츠를 관리합니다."
      />
      <div className="container">
        <nav className="admin-nav" aria-label="관리자 메뉴">
          {[
            ["/admin", "현황"],
            ["/admin/courses", "과정·차시"],
            ["/admin/members", "회원·수강"],
            ["/admin/inquiries", "문의"],
            ["/admin/posts", "기관소식"],
            ["/admin/documents", "발급문서"],
            ["/admin/settings", "기관·배너·팝업"],
            ["/admin/payments", "결제·취소"],
            ["/admin/videos", "영상관리"],
          ].map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ paddingBottom: 70 }}>{children}</div>
      </div>
    </>
  );
}

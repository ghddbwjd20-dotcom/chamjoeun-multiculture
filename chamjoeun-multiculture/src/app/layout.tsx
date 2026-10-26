import type { Metadata } from "next";
import { Header } from "@/components/header";
import { ContactWidgets } from "@/components/contact-widgets";
import { Footer } from "@/components/footer";
import "./globals.css";
import { query } from "@/lib/db";
import { SitePromotions } from "@/components/site-promotions";
export const metadata: Metadata = {
  title: {
    default: "참조은다문화(주) | 배움에서 정착까지",
    template: "%s | 참조은다문화",
  },
  description:
    "평생교육, 민간자격과정, 지역사회서비스, 도서납품과 외국인의 안정적인 정착을 연결합니다.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const promotions = await query(
    "SELECT id,kind,title,body,href FROM site_promotions WHERE active=true AND starts_at<=now() AND ends_at>now() ORDER BY starts_at DESC LIMIT 5",
  );
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          본문 바로가기
        </a>
        <Header />
        <SitePromotions
          items={
            promotions as {
              id: string;
              kind: string;
              title: string;
              body: string;
              href: string;
            }[]
          }
        />
        <main id="main">{children}</main>
        <Footer />
        <ContactWidgets kakaoUrl={process.env.KAKAO_CHANNEL_URL ?? ""} />
      </body>
    </html>
  );
}

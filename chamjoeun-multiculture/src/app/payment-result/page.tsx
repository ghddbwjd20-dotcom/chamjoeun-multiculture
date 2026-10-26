import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status = (await searchParams).status;
  const success = status === "success";
  return (
    <>
      <PageHeading
        eyebrow="PAYMENT RESULT"
        title={
          success ? "결제가 완료되었습니다." : "결제 상태를 확인해 주세요."
        }
        description={
          success
            ? "나의 강의실에서 신청한 교육을 시작할 수 있습니다."
            : status === "review"
              ? "승인 결과를 확인 중입니다. 중복 결제하지 말고 결제내역 또는 기관 안내를 확인해 주세요."
              : "결제가 완료되지 않았거나 요청 정보가 올바르지 않습니다."
        }
      />
      <div className="container content">
        <div className="actions">
          <Link
            href={success ? "/classroom" : "/mypage"}
            className="button primary"
          >
            {success ? "나의 강의실" : "결제내역 확인"}
          </Link>
          <Link href="/contact" className="button outline">
            결제 문의
          </Link>
        </div>
      </div>
    </>
  );
}

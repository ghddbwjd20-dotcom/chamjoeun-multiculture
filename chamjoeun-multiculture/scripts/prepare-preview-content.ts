import { Pool } from "pg";
if (
  process.env.NODE_ENV === "production" ||
  !process.env.DATABASE_URL ||
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL).hostname,
  )
)
  throw new Error("Local development only");
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await db.connect();
const guides = [
  {
    title: "사회통합프로그램(KIIP) 과정조회·신청 안내",
    category: "공지사항",
    body: "사회통합프로그램(KIIP)의 과정조회와 수강신청은 공식 사회통합정보망(Socinet)에서 진행합니다.\n\n이용 방법\n1. 홈페이지 주요 서비스의 ‘사회통합프로그램’ 또는 사업 안내의 ‘과정조회’를 선택합니다.\n2. 공식 사회통합정보망에서 과정과 신청 정보를 확인합니다.\n3. 프로그램 이용에 관해 기관 안내가 필요하면 대표전화 또는 온라인 문의를 이용해 주세요.\n\n공식 사이트\nhttps://www.socinet.go.kr/soci/main/main.jsp?MENU_TYPE=S_TOP_SY\n\n참조은다문화의 ‘교육과정 / 나의 강의실’은 자체 온라인 교육을 위한 서비스로, KIIP 신청·조회 절차와 구분됩니다.\n\n문의: 051-558-5629 / chamjoeund@gmail.com",
  },
  {
    title: "동포체류지원센터 정착·취업 상담 이용 안내",
    category: "공지사항",
    body: "참조은다문화 동포체류지원센터는 국내 체류 동포의 안정적인 정착과 자립을 지원합니다.\n\n주요 지원\n· 생활·제도·정착 관련 상담과 필요한 정보 안내\n· 구직 관련 상담, 취업정보 제공과 관련 기관 연계\n· 공공·교육·민간기관 등 지역사회 자원 연결\n\n이용 문의\n전화나 온라인 문의로 상담하고 싶은 내용을 알려주세요. 이용 방법과 담당자 안내를 확인하신 뒤 참여하실 수 있습니다. 방문 전 상담 분야와 필요한 안내사항을 먼저 확인하면 도움이 됩니다.\n\n대표전화: 051-558-5629\n이메일: chamjoeund@gmail.com\n주소: 부산 동래구 금강로 70, 참조은빌딩 5층·7층",
  },
  {
    title: "교육·사업 문의 시 확인하면 좋은 내용",
    category: "자료실",
    body: "교육과 사업에 관해 문의하실 때 아래 내용을 함께 알려주시면 안내에 도움이 됩니다.\n\n평생교육·민간자격과정\n관심 있는 과정, 참여 목적, 희망 일정과 문의 내용을 알려주세요. 과정별 개설 여부·교육기간·수강료·참여 방법은 현재 모집 안내 또는 상담에서 확인합니다.\n\n지역사회서비스투자사업\n관심 서비스와 이용 목적을 알려주세요. 사업별 대상과 참여 조건, 이용 절차를 확인해 안내합니다.\n\n도서납품\n도서명 또는 ISBN, 수량, 납품 장소와 희망 일정을 알려주세요. 품목과 공급 조건을 확인한 뒤 안내합니다.\n\n사업제휴\n기관명, 제휴 목적, 협력하고 싶은 분야와 연락처를 남겨주세요.\n\n문의 접수: 홈페이지 ‘교육·사업 문의’\n대표전화: 051-558-5629",
  },
];
try {
  await client.query("BEGIN");
  await client.query(
    "UPDATE lessons SET title='소개영상 재생 확인용 · 약 12초',duration_seconds=13,video_key='development/institution-film.mp4',video_status='ready' WHERE course_id=(SELECT id FROM courses WHERE slug='development-sample')",
  );
  for (const g of guides) {
    await client.query(
      "INSERT INTO posts(title,category,body,published,pinned) SELECT $1,$2,$3,true,$4 WHERE NOT EXISTS(SELECT 1 FROM posts WHERE title=$1)",
      [g.title, g.category, g.body, g.category === "공지사항"],
    );
  }
  await client.query("COMMIT");
  console.log(
    "Prepared local preview video and informational board guides from supplied brief. No external publication.",
  );
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await db.end();
}

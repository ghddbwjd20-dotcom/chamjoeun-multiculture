import { query } from "@/lib/db";
export type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  instructor: string;
  price: number;
  duration_days: number;
  completion_threshold: number;
  status: string;
  lesson_count?: string;
};
export async function courses(search = "") {
  return query<Course>(
    `SELECT c.*, (SELECT count(*) FROM lessons WHERE course_id=c.id) lesson_count FROM courses c WHERE c.status='published' AND (c.title ILIKE $1 OR c.category ILIKE $1) ORDER BY c.created_at DESC`,
    [`%${search}%`],
  );
}
export const programs = [
  {
    slug: "lifelong",
    number: "01",
    name: "평생교육",
    en: "Lifelong learning",
    description: "생애주기에 맞는 배움으로 일상과 가능성을 넓힙니다.",
    image: "pillar-lifelong.jpg",
  },
  {
    slug: "qualification",
    number: "02",
    name: "민간자격과정",
    en: "Professional development",
    description: "현장에서 활용할 수 있는 전문 역량을 기릅니다.",
    image: "pillar-license.jpg",
  },
  {
    slug: "community",
    number: "03",
    name: "지역사회서비스투자사업",
    en: "Community services",
    description: "지역과 함께 필요한 돌봄과 교육을 연결합니다.",
    image: "pillar-community.jpg",
  },
  {
    slug: "books",
    number: "04",
    name: "도서납품",
    en: "Books & resources",
    description: "교육기관과 지역사회의 배움을 위한 도서를 연결합니다.",
    image: "pillar-books.jpg",
  },
];
export const socinet =
  "https://www.socinet.go.kr/soci/main/main.jsp?MENU_TYPE=S_TOP_SY";

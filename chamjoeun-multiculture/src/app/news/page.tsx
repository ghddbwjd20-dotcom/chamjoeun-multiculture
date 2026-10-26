import Link from "next/link";
import {
  Paperclip,
  ArrowUpRight,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { query } from "@/lib/db";
import { boardCategories, boardCategory, pageNumber } from "@/lib/board";
import { PageHeading } from "@/components/page-heading";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const args = await searchParams;
  const q = args.q?.trim().slice(0, 100) ?? "",
    category = boardCategory(args.category);
  const [count] = await query(
    "SELECT count(*) total FROM posts WHERE published=true AND deleted_at IS NULL AND ($1='전체' OR category=$1) AND (title ILIKE $2 OR body ILIKE $2)",
    [category, `%${q}%`],
  );
  const total = Number(count.total),
    pages = Math.max(1, Math.ceil(total / 10)),
    page = Math.min(pageNumber(args.page), pages);
  const posts = await query(
    `SELECT p.id,p.title,p.category,p.created_at,p.pinned,left(p.body,160) excerpt,(SELECT count(*) FROM attachments a WHERE a.post_id=p.id AND a.deleted_at IS NULL) files,(SELECT a.id FROM attachments a WHERE a.post_id=p.id AND a.deleted_at IS NULL AND a.mime_type LIKE 'image/%' ORDER BY a.created_at LIMIT 1) thumbnail FROM posts p WHERE p.published=true AND p.deleted_at IS NULL AND ($1='전체' OR p.category=$1) AND (p.title ILIKE $2 OR p.body ILIKE $2) ORDER BY p.pinned DESC,p.created_at DESC LIMIT 10 OFFSET $3`,
    [category, `%${q}%`, (page - 1) * 10],
  );
  const link = (p: number) =>
    `/news?${new URLSearchParams({ category: category ?? "전체", q: q ?? "", page: String(p) })}`;
  const gallery = ["행사사진", "업무협약"].includes(category!);
  return (
    <>
      <PageHeading
        eyebrow="NEWS & STORIES"
        title="참조은다문화의 소식"
        description="교육과 지원사업의 안내부터 현장의 이야기, 함께하는 기관의 소식까지. 필요한 내용을 분류별로 확인하세요."
      />
      <div className="container content">
        <nav className="board-categories" aria-label="게시판 분류">
          {["전체", ...boardCategories].map((c) => (
            <Link
              href={`/news?category=${c}`}
              className={category === c ? "active" : ""}
              aria-current={category === c ? "page" : undefined}
              key={c}
            >
              {c}
            </Link>
          ))}
        </nav>
        <div className="board-list-heading">
          <p>
            전체 <strong>{total}</strong>건{" "}
            <span>{category !== "전체" ? `· ${category}` : ""}</span>
          </p>
          <form className="search">
            <input type="hidden" name="category" value={category} />
            <input
              name="q"
              aria-label="게시글 제목·내용 검색"
              placeholder="제목 또는 내용을 검색하세요"
              defaultValue={q}
              maxLength={100}
            />
            <button className="button primary">검색</button>
          </form>
        </div>
        {posts.length ? (
          gallery ? (
            <div className="board-gallery">
              {posts.map((p) => (
                <Link href={`/news/${p.id}`} key={p.id}>
                  <div className="gallery-image">
                    {p.thumbnail ? (
                      <img
                        src={`/api/attachments/${p.thumbnail}`}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <>
                        <ImageIcon size={34} />
                        <span>이미지 등록 전</span>
                      </>
                    )}
                  </div>
                  <span className="badge">{p.category}</span>
                  <h2>{p.title}</h2>
                  <p>{p.excerpt}</p>
                  <time>
                    {new Date(p.created_at).toLocaleDateString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="public-board">
              <div className="board-table-head">
                <span>분류</span>
                <span>제목</span>
                <span>첨부</span>
                <span>등록일</span>
              </div>
              {posts.map((p) => (
                <Link
                  className="board-table-row"
                  href={`/news/${p.id}`}
                  key={p.id}
                >
                  <span className="badge">{p.category}</span>
                  <div>
                    <strong>
                      {p.pinned && <em>공지</em>}
                      {p.title}
                    </strong>
                    <p>{p.excerpt}</p>
                  </div>
                  <span className="board-file">
                    {Number(p.files) > 0 ? (
                      <>
                        <Paperclip size={15} />
                        <small>{p.files}</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                  <time>
                    {new Date(p.created_at).toLocaleDateString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </time>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="empty-state">
            <FileText
              size={32}
              style={{ margin: "0 auto 20px", color: "#869aaf" }}
            />
            <h2>{q ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}</h2>
            <p>
              {q
                ? "다른 검색어를 입력하거나 전체 게시판에서 찾아보세요."
                : "새로운 소식과 자료를 준비하고 있습니다."}
            </p>
            <Link href="/news" className="text-link">
              전체 소식 보기 <ArrowUpRight size={15} />
            </Link>
          </div>
        )}
        {pages > 1 && (
          <nav className="pagination" aria-label="게시글 페이지">
            {page > 1 && <Link href={link(page - 1)}>이전</Link>}
            {Array.from(
              { length: Math.min(7, pages) },
              (_, i) => Math.max(1, Math.min(page - 3, pages - 6)) + i,
            ).map((n) => (
              <Link
                key={n}
                href={link(n)}
                aria-current={page === n ? "page" : undefined}
              >
                {n}
              </Link>
            ))}
            {page < pages && <Link href={link(page + 1)}>다음</Link>}
          </nav>
        )}
        <div className="board-help">
          <span>원하는 정보를 찾지 못하셨나요?</span>
          <Link href="/contact">
            교육·사업 이용 문의 <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { query } from "@/lib/db";
import { boardCategories, boardCategory } from "@/lib/board";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; archived?: string }>;
}) {
  const q = await searchParams;
  const category = boardCategory(q.category);
  const archived = q.archived === "yes";
  const list = await query(
    `SELECT p.*,(SELECT count(*) FROM attachments a WHERE a.post_id=p.id AND a.deleted_at IS NULL) files FROM posts p WHERE ${archived ? "p.deleted_at IS NOT NULL" : "p.deleted_at IS NULL"} AND ($1='전체' OR p.category=$1) ORDER BY p.pinned DESC,p.created_at DESC LIMIT 100`,
    [category],
  );
  return (
    <>
      <div className="board-toolbar">
        <div>
          <h2 className="section-title">게시판 관리</h2>
          <p className="muted">
            분류별 게시글 작성·수정, 공개 여부와 첨부파일을 관리합니다.
          </p>
        </div>
        <Link href="/admin/posts/new" className="button primary">
          새 글 작성 +
        </Link>
      </div>
      <div className="board-categories">
        <Link
          href="/admin/posts"
          className={category === "전체" ? "active" : ""}
        >
          전체
        </Link>
        {boardCategories.map((c) => (
          <Link
            href={`/admin/posts?category=${c}`}
            key={c}
            className={category === c ? "active" : ""}
          >
            {c}
          </Link>
        ))}
        <Link href="/admin/posts?archived=yes">보관함</Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>분류</th>
              <th>제목</th>
              <th>공개</th>
              <th>첨부</th>
              <th>수정일</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.category}</td>
                <td className="title-cell">
                  <Link href={`/admin/posts/${p.id}`}>
                    {p.pinned ? "[고정] " : ""}
                    {p.title}
                  </Link>
                </td>
                <td>
                  {p.deleted_at ? "보관" : p.published ? "공개" : "비공개"}
                </td>
                <td>{p.files}</td>
                <td>
                  {new Date(p.updated_at).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && (
        <div className="empty-state">
          <h3>게시글이 없습니다.</h3>
          <p>새 글을 작성하거나 다른 분류를 선택하세요.</p>
        </div>
      )}
    </>
  );
}

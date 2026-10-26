import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Paperclip, Download, ArrowLeft } from "lucide-react";
import { query } from "@/lib/db";
import { PageHeading } from "@/components/page-heading";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [p] = await query(
    "SELECT * FROM posts WHERE id=$1 AND published=true AND deleted_at IS NULL",
    [id],
  );
  if (!p) notFound();
  const files = await query(
    "SELECT id,original_name,size_bytes,mime_type FROM attachments WHERE post_id=$1 AND deleted_at IS NULL ORDER BY created_at",
    [id],
  );
  const nearby = await query(
    "SELECT id,title FROM posts WHERE published=true AND deleted_at IS NULL AND id<>$1 AND category=$2 ORDER BY created_at DESC LIMIT 2",
    [id, p.category],
  );
  const images = files.filter((f) => f.mime_type.startsWith("image/"));
  return (
    <>
      <PageHeading
        eyebrow="NEWS & STORIES"
        title="기관소식"
        description="참조은다문화의 교육과 사업 이야기를 전합니다."
      />
      <article className="container content post-detail">
        <header className="post-title">
          <span className="badge">{p.category}</span>
          <h1>{p.title}</h1>
          <div>
            <span>참조은다문화(주)</span>
            <time>
              {new Date(p.created_at).toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
            </time>
            {p.pinned && <span>상단 고정</span>}
          </div>
        </header>
        <div className="post-body">{p.body}</div>
        {images.length > 0 && (
          <div className="post-images">
            {images.map((f) => (
              <figure key={f.id}>
                <img
                  src={`/api/attachments/${f.id}`}
                  alt={f.original_name}
                  loading="lazy"
                />
                <figcaption>{f.original_name}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {files.length > 0 && (
          <section className="post-attachments">
            <h2>
              <Paperclip size={18} /> 첨부파일 <span>{files.length}</span>
            </h2>
            {files.map((f) => (
              <a key={f.id} href={`/api/attachments/${f.id}`} download>
                <span>
                  {f.original_name}
                  <small>{(f.size_bytes / 1024).toFixed(0)}KB</small>
                </span>
                <Download size={17} />
              </a>
            ))}
          </section>
        )}
        <nav className="post-related" aria-label="같은 분류 다른 글">
          {nearby.map((n) => (
            <Link href={`/news/${n.id}`} key={n.id}>
              <span>{p.category}</span>
              <strong>{n.title}</strong>
            </Link>
          ))}
        </nav>
        <div className="post-bottom">
          <Link
            href={`/news?category=${p.category}`}
            className="button outline"
          >
            <ArrowLeft size={16} /> 목록으로
          </Link>
        </div>
      </article>
    </>
  );
}

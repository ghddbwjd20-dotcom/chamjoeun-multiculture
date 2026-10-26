import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import { PostForm } from "@/components/post-form";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { ActionForm } from "@/components/form";
import { archivePost, restorePost } from "@/app/admin/actions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [p] = await query("SELECT * FROM posts WHERE id=$1", [id]);
  if (!p) notFound();
  const files = await query<{
    id: string;
    original_name: string;
    size_bytes: number;
  }>(
    "SELECT id,original_name,size_bytes FROM attachments WHERE post_id=$1 AND deleted_at IS NULL ORDER BY created_at",
    [id],
  );
  return (
    <div className="editor-form">
      <div className="board-toolbar">
        <h2 className="section-title">게시글 수정</h2>
        <Link href="/admin/posts" className="text-link">
          목록으로 →
        </Link>
      </div>
      {p.deleted_at ? (
        <>
          <p className="alert">
            보관된 글입니다. 복원하면 비공개 상태로 돌아갑니다.
          </p>
          <ActionForm action={restorePost} label="비공개 상태로 복원">
            <input name="id" type="hidden" value={id} />
          </ActionForm>
        </>
      ) : (
        <>
          <PostForm post={p as import("@/components/post-form").PostEdit} />
          <AttachmentUploader postId={id} files={files} />
          <div className="archive-panel">
            <h3>게시글 보관</h3>
            <p>
              사용자 목록에서 숨기고 보관함으로 이동합니다. 원문과 첨부파일은
              유지됩니다.
            </p>
            <ActionForm action={archivePost} label="게시글 보관하기">
              <input name="id" type="hidden" value={id} />
            </ActionForm>
          </div>
        </>
      )}
    </div>
  );
}

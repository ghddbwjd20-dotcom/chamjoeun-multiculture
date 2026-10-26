import { ActionForm } from "@/components/form";
import { savePost } from "@/app/admin/actions";
import { boardCategories } from "@/lib/board";
export type PostEdit = {
  id: string;
  title: string;
  category: string;
  body: string;
  published: boolean;
  pinned: boolean;
};
export function PostForm({ post }: { post?: PostEdit }) {
  return (
    <ActionForm
      action={savePost}
      label={post ? "수정 내용 저장" : "게시글 저장"}
    >
      {post && <input name="id" type="hidden" value={post.id} />}
      <label>
        분류
        <select name="category" defaultValue={post?.category ?? "공지사항"}>
          {boardCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        제목
        <input
          name="title"
          minLength={2}
          maxLength={150}
          defaultValue={post?.title}
          required
        />
      </label>
      <label>
        본문
        <textarea
          name="body"
          minLength={5}
          maxLength={30000}
          defaultValue={post?.body}
          style={{ minHeight: 350 }}
          required
        />
        <small>
          줄바꿈을 포함해 입력한 내용 그대로 표시합니다. 첨부파일은 글을 저장한
          뒤 등록하세요.
        </small>
      </label>
      <label className="checkbox">
        <input type="checkbox" name="pinned" defaultChecked={post?.pinned} />
        <span>목록 상단에 고정</span>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published}
        />
        <span>사용자에게 공개</span>
      </label>
    </ActionForm>
  );
}

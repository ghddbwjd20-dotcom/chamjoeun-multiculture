import { PostForm } from "@/components/post-form";
export default function Page() {
  return (
    <section className="editor-form">
      <span className="eyebrow">NEW POST</span>
      <h2 className="section-title">새 게시글 작성</h2>
      <PostForm />
    </section>
  );
}

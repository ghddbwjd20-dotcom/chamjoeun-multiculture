"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import type { FormState } from "@/components/form";
const courseSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  category: z.string().min(1).max(60),
  summary: z.string().trim().min(5).max(300),
  description: z.string().max(10000),
  instructor: z.string().max(60),
  price: z.coerce.number().int().min(0).max(10000000),
  duration_days: z.coerce.number().int().min(1).max(3650),
  completion_threshold: z.coerce.number().int().min(1).max(100),
  status: z.enum(["draft", "published", "archived"]),
});
export async function saveCourse(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = courseSchema.safeParse(Object.fromEntries(form));
  if (!p.success)
    return {
      error:
        "입력값을 확인해 주세요. 주소는 영문 소문자·숫자·하이픈만 사용할 수 있습니다.",
    };
  const d = p.data;
  const id = form.get("id");
  if (id && !z.uuid().safeParse(id).success)
    return { error: "과정 ID가 올바르지 않습니다." };
  try {
    await transaction(async (c) => {
      let entityId = id;
      if (id) {
        const r = await c.query(
          "UPDATE courses SET title=$1,slug=$2,category=$3,summary=$4,description=$5,instructor=$6,price=$7,duration_days=$8,completion_threshold=$9,status=$10 WHERE id=$11 RETURNING id",
          [
            d.title,
            d.slug,
            d.category,
            d.summary,
            d.description,
            d.instructor,
            d.price,
            d.duration_days,
            d.completion_threshold,
            d.status,
            id,
          ],
        );
        if (!r.rows[0]) throw new Error("Course not found");
      } else {
        const r = await c.query(
          "INSERT INTO courses(title,slug,category,summary,description,instructor,price,duration_days,completion_threshold,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
          [
            d.title,
            d.slug,
            d.category,
            d.summary,
            d.description,
            d.instructor,
            d.price,
            d.duration_days,
            d.completion_threshold,
            d.status,
          ],
        );
        entityId = r.rows[0].id;
      }
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,$2,$3)",
        [user.id, id ? "과정 수정" : "과정 생성", entityId],
      );
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return { error: "이미 사용 중인 과정 주소입니다." };
    throw e;
  }
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { success: "교육과정을 저장했습니다." };
}
export async function addLesson(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({
      course_id: z.uuid(),
      title: z.string().trim().min(2).max(150),
      position: z.coerce.number().int().min(1).max(1000),
      duration_seconds: z.coerce.number().int().min(1).max(86400),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "차시 정보를 확인해 주세요." };
  const d = p.data;
  try {
    await transaction(async (c) => {
      const r = await c.query(
        "INSERT INTO lessons(course_id,title,position,duration_seconds) VALUES($1,$2,$3,$4) RETURNING id",
        [d.course_id, d.title, d.position, d.duration_seconds],
      );
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'차시 생성',$2)",
        [user.id, r.rows[0].id],
      );
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return { error: "같은 순서의 차시가 이미 있습니다." };
    throw e;
  }
  revalidatePath("/admin/courses");
  return {
    success: "차시를 추가했습니다. 영상은 업로드 연동 후 등록할 수 있습니다.",
  };
}
export async function answerInquiry(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({ id: z.uuid(), answer: z.string().trim().min(5).max(5000) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "5자 이상의 답변을 입력해 주세요." };
  await transaction(async (c) => {
    await c.query(
      "UPDATE inquiries SET answer=$1,status='answered',answered_by=$2,answered_at=now() WHERE id=$3",
      [p.data.answer, user.id, p.data.id],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'문의 답변 기록',$2)",
      [user.id, p.data.id],
    );
  });
  revalidatePath("/admin/inquiries");
  return {
    success:
      "답변을 저장했습니다. 현재 자동 메일 전송은 연결되지 않았으므로 고객 이메일로 별도 안내해 주세요.",
  };
}
export async function savePost(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({
      title: z.string().trim().min(2).max(150),
      category: z.enum([
        "공지사항",
        "사업소식",
        "행사사진",
        "자료실",
        "업무협약",
      ]),
      body: z.string().trim().min(5).max(30000),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "제목과 5자 이상의 본문을 입력해 주세요." };
  const id = form.get("id");
  if (id && !z.uuid().safeParse(id).success)
    return { error: "게시글을 확인해 주세요." };
  const d = p.data;
  const saved = await transaction(async (c) => {
    let entityId: string;
    if (id) {
      const r = await c.query(
        "UPDATE posts SET title=$1,category=$2,body=$3,published=$4,pinned=$5,updated_at=now() WHERE id=$6 AND deleted_at IS NULL RETURNING id",
        [
          d.title,
          d.category,
          d.body,
          form.get("published") === "on",
          form.get("pinned") === "on",
          id,
        ],
      );
      if (!r.rows[0]) return null;
      entityId = r.rows[0].id;
    } else {
      const r = await c.query(
        "INSERT INTO posts(title,category,body,published,pinned) VALUES($1,$2,$3,$4,$5) RETURNING id",
        [
          d.title,
          d.category,
          d.body,
          form.get("published") === "on",
          form.get("pinned") === "on",
        ],
      );
      entityId = r.rows[0].id;
    }
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,$2,$3)",
      [user.id, id ? "게시글 수정" : "게시글 등록", entityId],
    );
    return entityId;
  });
  if (!saved) return { error: "수정할 수 없는 게시글입니다." };
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");
  if (!id) {
    const { redirect } = await import("next/navigation");
    redirect(`/admin/posts/${saved}`);
  }
  return { success: "게시글을 저장했습니다." };
}
export async function archivePost(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const id = form.get("id");
  if (!z.uuid().safeParse(id).success)
    return { error: "게시글을 확인해 주세요." };
  await transaction(async (c) => {
    await c.query(
      "UPDATE posts SET deleted_at=now(),published=false,updated_at=now() WHERE id=$1",
      [id],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'게시글 보관',$2)",
      [user.id, id],
    );
  });
  revalidatePath("/news");
  revalidatePath("/");
  revalidatePath("/admin/posts");
  return { success: "게시글을 보관했습니다." };
}
export async function restorePost(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const id = form.get("id");
  if (!z.uuid().safeParse(id).success)
    return { error: "게시글을 확인해 주세요." };
  await transaction(async (c) => {
    await c.query(
      "UPDATE posts SET deleted_at=NULL,published=false,updated_at=now() WHERE id=$1",
      [id],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'게시글 복원',$2)",
      [user.id, id],
    );
  });
  revalidatePath("/admin/posts");
  return { success: "비공개 상태로 복원했습니다." };
}
export async function manualComplete(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({ id: z.uuid(), reason: z.string().trim().min(5).max(1000) })
    .safeParse(Object.fromEntries(form));
  if (!p.success)
    return { error: "수강신청과 5자 이상의 사유를 확인해 주세요." };
  await transaction(async (c) => {
    const r = await c.query(
      "UPDATE enrollments SET status='completed',completed_at=now() WHERE id=$1 AND status='active' RETURNING id",
      [p.data.id],
    );
    if (!r.rows[0]) return;
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,'수동 수료',$2,$3)",
      [user.id, p.data.id, JSON.stringify({ reason: p.data.reason })],
    );
  });
  revalidatePath("/admin/members");
  return { success: "수료 상태와 관리자·사유·일시를 기록했습니다." };
}

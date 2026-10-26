"use server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/form";
import { z } from "zod";
export async function enroll(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = form.get("courseId");
  if (!z.uuid().safeParse(id).success)
    return { error: "과정을 확인해 주세요." };
  const [c] = await query(
    "SELECT * FROM courses WHERE id=$1 AND status='published'",
    [id],
  );
  if (!c) return { error: "현재 신청할 수 없는 과정입니다." };
  if (c.price > 0)
    return { error: "유료과정 결제는 준비 중입니다. 기관에 문의해 주세요." };
  await query(
    "INSERT INTO enrollments(user_id,course_id,expires_at) VALUES($1,$2,now()+($3 * interval '1 day')) ON CONFLICT(user_id,course_id) DO NOTHING",
    [u.id, c.id, c.duration_days],
  );
  redirect("/classroom");
}

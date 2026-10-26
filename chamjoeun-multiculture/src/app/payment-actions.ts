"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
export async function createCheckout(courseId: string) {
  const user = await requireUser();
  if (!z.uuid().safeParse(courseId).success)
    return { error: "과정을 확인해 주세요." };
  if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || !process.env.TOSS_SECRET_KEY)
    return { error: "결제 서비스를 준비 중입니다. 기관에 문의해 주세요." };
  const [c] = await query(
    "SELECT * FROM courses WHERE id=$1 AND status='published' AND price>0",
    [courseId],
  );
  if (!c) return { error: "결제 가능한 과정이 아닙니다." };
  const [existing] = await query(
    "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2 AND status IN ('active','completed')",
    [user.id, courseId],
  );
  if (existing)
    return { error: "이미 신청한 과정입니다. 재수강은 기관에 문의해 주세요." };
  const [order] = await query(
    "INSERT INTO orders(user_id,course_id,amount,course_title) VALUES($1,$2,$3,$4) RETURNING id",
    [user.id, c.id, c.price, c.title],
  );
  return {
    orderId: order.id as string,
    amount: c.price as number,
    title: c.title as string,
    customerKey: user.id,
    email: user.email,
    name: user.name,
    base: process.env.APP_URL ?? "http://127.0.0.1:3000",
    clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  };
}

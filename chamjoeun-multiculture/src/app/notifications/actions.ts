"use server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function markNotificationsRead(form:FormData) {
  const user=await requireUser();const id=String(form.get("id")??"");
  if(id&& !z.uuid().safeParse(id).success)return;
  await query("UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL AND ($2::uuid IS NULL OR id=$2)",[user.id,id||null]);
  revalidatePath("/notifications");revalidatePath("/","layout");
}

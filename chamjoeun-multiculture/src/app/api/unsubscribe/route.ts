import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { unsubscribeNewsletter } from "@/lib/delivery";
export async function POST(request:Request) {
  await unsubscribeNewsletter(pool(),new URL(request.url).searchParams.get("token")??"");
  return new NextResponse("교육·사업 소식 이메일 수신거부를 처리했습니다.",{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
}

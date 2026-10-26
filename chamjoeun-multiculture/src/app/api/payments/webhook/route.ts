import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { reconcilePayment } from "@/lib/payments";
export async function POST(request: NextRequest) {
  const configured = process.env.TOSS_WEBHOOK_TOKEN;
  const supplied = request.nextUrl.searchParams.get("token") ?? "";
  if (
    !configured ||
    Buffer.byteLength(configured) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(configured), Buffer.from(supplied))
  )
    return new NextResponse(null, { status: 403 });
  let data;
  try {
    data = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const id = data?.data?.orderId;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 400 });
  try {
    await reconcilePayment(id);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false }, { status: 503 });
  }
}

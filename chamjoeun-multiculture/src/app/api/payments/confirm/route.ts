import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { confirmPayment } from "@/lib/payments";
export async function GET(request: NextRequest) {
  const base = process.env.APP_URL ?? request.url;
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", base));
  const p = z
    .object({
      orderId: z.uuid(),
      paymentKey: z.string().min(5).max(200),
      amount: z.coerce.number().int().min(1),
    })
    .safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!p.success)
    return NextResponse.redirect(
      new URL("/payment-result?status=invalid", base),
    );
  try {
    await confirmPayment(
      user.id,
      p.data.orderId,
      p.data.paymentKey,
      p.data.amount,
    );
    return NextResponse.redirect(
      new URL("/payment-result?status=success", base),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/payment-result?status=review", base),
    );
  }
}

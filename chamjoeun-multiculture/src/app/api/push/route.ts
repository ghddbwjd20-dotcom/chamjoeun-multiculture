import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { allowedPushEndpoint, channelConfigured } from "@/lib/delivery-policy";

const endpoint = z.string().max(2048).refine(allowedPushEndpoint);
const subscription = z.object({
  endpoint,
  keys: z.object({
    p256dh: z.string().regex(/^[\w-]{87}$/),
    auth: z.string().regex(/^[\w-]{22}$/),
  }),
});
async function update(request: NextRequest, remove: boolean) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.APP_URL ?? request.url).origin
  )
    return NextResponse.json(
      { error: "요청 출처를 확인해 주세요." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  const payload = await request.json().catch(() => null);
  if (remove) {
    const result = z.object({ endpoint }).safeParse(payload);
    if (!result.success)
      return NextResponse.json(
        { error: "구독 주소를 확인해 주세요." },
        { status: 400 },
      );
    await query(
      "DELETE FROM push_subscriptions WHERE user_id=$1 AND endpoint=$2",
      [user.id, result.data.endpoint],
    );
  } else {
    if (!channelConfigured("push"))
      return NextResponse.json(
        { error: "푸시 설정을 준비 중입니다." },
        { status: 503 },
      );
    const result = subscription.safeParse(payload);
    if (!result.success)
      return NextResponse.json(
        { error: "구독 정보를 확인해 주세요." },
        { status: 400 },
      );
    await query(
      `INSERT INTO push_subscriptions(user_id,endpoint,subscription) VALUES($1,$2,$3)
      ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,subscription=EXCLUDED.subscription`,
      [user.id, result.data.endpoint, JSON.stringify(result.data)],
    );
  }
  return NextResponse.json({ success: true });
}
export const POST = (request: NextRequest) => update(request, false);
export const DELETE = (request: NextRequest) => update(request, true);

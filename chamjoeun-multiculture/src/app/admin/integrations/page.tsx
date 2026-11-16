import { query } from "@/lib/db";
import {
  channelConfigured,
  channelLabels,
  sendingEnabled,
} from "@/lib/delivery-policy";
import { storageConfigured } from "@/lib/storage";

export default async function Page() {
  const workers = await query(
    "SELECT name,last_run_at FROM worker_heartbeats ORDER BY name",
  );
  const entries: [string, boolean][] = [
    ["인증메일", channelConfigured("email")],
    ["영상 저장소", storageConfigured()],
    [
      "권한 확인 영상 재생",
      Boolean(
        process.env.VIDEO_GATEWAY_URL && process.env.VIDEO_SIGNING_SECRET,
      ),
    ],
    [
      "토스페이먼츠",
      Boolean(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY &&
        process.env.TOSS_SECRET_KEY &&
        process.env.TOSS_WEBHOOK_TOKEN,
      ),
    ],
    ...["GOOGLE", "NAVER", "KAKAO"].map(
      (provider) =>
        [
          provider + " 소셜 로그인",
          Boolean(
            process.env[provider + "_CLIENT_ID"] &&
            process.env[provider + "_CLIENT_SECRET"],
          ),
        ] as [string, boolean],
    ),
    ...(["sms", "alimtalk", "push"] as const).map(
      (channel) =>
        [channelLabels[channel], channelConfigured(channel)] as [
          string,
          boolean,
        ],
    ),
  ];
  return (
    <section className="info-card">
      <h2>외부 서비스 설정 상태</h2>
      <p>
        환경설정 입력 여부입니다. 실제 연결 결과는 기능별 테스트로 확인해
        주세요.
      </p>
      <p>외부 알림 발송 {sendingEnabled() ? "켜짐" : "꺼짐"}</p>
      <dl>
        {entries.map(([name, configured]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{configured ? "설정 입력됨" : "설정 대기"}</dd>
          </div>
        ))}
      </dl>
      <h3>작업자 마지막 실행</h3>
      <ul>
        {workers.map((worker) => (
          <li key={worker.name}>
            {worker.name} ·{" "}
            {new Date(worker.last_run_at).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}

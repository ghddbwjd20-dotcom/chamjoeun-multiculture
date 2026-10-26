import { query } from "@/lib/db";
import { storageConfigured } from "@/lib/storage";
import { VideoUpload } from "@/components/video-upload";
export default async function Page() {
  const list = await query(
    "SELECT l.*,c.title course_title,j.id job_id,j.status job_status,j.stage,j.error FROM lessons l JOIN courses c ON c.id=l.course_id LEFT JOIN LATERAL(SELECT * FROM video_jobs WHERE lesson_id=l.id ORDER BY created_at DESC LIMIT 1) j ON true ORDER BY c.created_at DESC,l.position",
  );
  const [usage] = await query(
    "SELECT COALESCE(sum(reserved_bytes),0) reserved FROM video_uploads WHERE status<>'aborted'",
  );
  return (
    <>
      <h2 className="section-title">영상 업로드·자동 변환</h2>
      <p className="alert">
        영상은 비공개 스토리지에 직접 업로드합니다. 업로드와 HLS 변환 상태는
        별개입니다. 저장 예약량 {Math.ceil(Number(usage.reserved) / 1024 ** 3)}
        GB / {process.env.VIDEO_STORAGE_CAP_GB ?? 500}GB
      </p>
      {!storageConfigured() && (
        <p className="alert error" style={{ marginTop: 20 }}>
          R2/S3 스토리지 키와 버킷 설정이 필요합니다. 현재 외부 업로드는
          실행하지 않습니다.
        </p>
      )}
      <div className="stack" style={{ marginTop: 30 }}>
        {list.map((l) => (
          <section className="info-card" key={l.id}>
            <span className="badge">
              {l.video_status} {l.stage ? `· ${l.stage}` : ""}
            </span>
            <h3 style={{ marginTop: 15 }}>
              {l.course_title} / {l.position}. {l.title}
            </h3>
            <p>재생시간 {l.duration_seconds}초</p>
            {l.error && <p className="alert error">{l.error}</p>}
            <VideoUpload
              lessonId={l.id}
              jobId={l.job_id}
              status={l.job_status ?? l.video_status}
            />
          </section>
        ))}
      </div>
    </>
  );
}

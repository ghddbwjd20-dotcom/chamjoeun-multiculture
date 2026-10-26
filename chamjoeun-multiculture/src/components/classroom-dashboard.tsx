"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Play,
  FileDown,
  Award,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Bell,
  GraduationCap,
} from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import type { LearningCourse } from "@/lib/learning";
export type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  duration_seconds: number;
  video_status: string;
  watched_seconds: number;
  last_position: number;
  updated_at: string | null;
};
export function ClassroomDashboard({
  name,
  courses,
  lessons,
  daily,
  documents,
  notices,
}: {
  name: string;
  courses: LearningCourse[];
  lessons: LessonRow[];
  daily: { day: string; seconds: number }[];
  documents: {
    id: string;
    document_number: string;
    kind: string;
    title: string;
    issued_at: string;
  }[];
  notices: { id: string; title: string; created_at: string }[];
}) {
  const [tab, setTab] = useState("전체"),
    [selected, setSelected] = useState(courses[0]?.id ?? "");
  const now = Date.now(),
    active = courses.filter(
      (c) => c.status === "active" && new Date(c.expires_at).getTime() > now,
    ),
    completed = courses.filter((c) => c.status === "completed"),
    total = courses.reduce((s, c) => s + c.duration, 0),
    watched = courses.reduce((s, c) => s + c.watched, 0),
    avg = total ? Math.min(100, Math.floor((watched / total) * 100)) : 0;
  const completedLessons = courses.reduce((s, c) => s + c.completed_lessons, 0),
    totalLessons = courses.reduce((s, c) => s + c.lesson_count, 0);
  const list = courses.filter(
    (c) =>
      tab === "전체" ||
      (tab === "수강 중" &&
        c.status === "active" &&
        new Date(c.expires_at).getTime() > now) ||
      (tab === "수료" && c.status === "completed") ||
      (tab === "기간 종료" &&
        c.status !== "completed" &&
        new Date(c.expires_at).getTime() <= now),
  );
  const course = courses.find((c) => c.id === selected);
  const lessonList = lessons.filter((l) => l.course_id === selected);
  const recent =
    active[0] ?? completed.find((c) => new Date(c.expires_at).getTime() > now);
  const next = recent
    ? (lessons.find(
        (l) =>
          l.course_id === recent.id &&
          Number(l.watched_seconds) <
            (l.duration_seconds * recent.completion_threshold) / 100,
      ) ?? lessons.find((l) => l.course_id === recent.id))
    : null;
  const maxDaily = Math.max(60, ...daily.map((d) => d.seconds));
  return (
    <div className="classroom-dashboard">
      <nav className="learner-navigation" aria-label="학습 메뉴">
        <a href="#learning-overview" className="active">
          <ChartNoAxesCombined size={17} />
          학습현황
        </a>
        <a href="#my-courses">
          <BookOpen size={17} />
          수강과정
        </a>
        <a href="#lesson-status">
          <CalendarDays size={17} />
          차시별 현황
        </a>
        <a href="#documents">
          <Award size={17} />
          수료·발급문서
        </a>
        <Link href="/mypage">
          <GraduationCap size={17} />
          회원·결제정보
        </Link>
      </nav>
      <section id="learning-overview" className="learner-overview">
        <div className="learner-welcome">
          <div>
            <span className="eyebrow">MY LEARNING OVERVIEW</span>
            <h2>{name}님, 오늘의 배움을 이어가세요.</h2>
            <p>
              수강 중 {active.length}개 과정 · 수료 {completed.length}개 과정 ·
              학습완료 {completedLessons}/{totalLessons}차시
            </p>
          </div>
          <Link href="/courses" className="button outline">
            교육과정 찾아보기 <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="learner-stats">
          <div className="learner-progress-summary">
            <ProgressRing value={avg} label="전체 학습 진도" />
            <div>
              <span>나의 학습 여정</span>
              <strong>
                {completedLessons}
                <small> / {totalLessons}차시 완료</small>
              </strong>
              <p>실제 시청 구간 기준 · 중복 구간 제외</p>
            </div>
          </div>
          <div className="learner-stat">
            <Clock size={23} />
            <strong>
              {Math.floor(watched / 60)}
              <small>분</small>
            </strong>
            <span>진도 인정 시청시간</span>
          </div>
          <div className="learner-stat">
            <BookOpen size={23} />
            <strong>
              {active.length}
              <small>개</small>
            </strong>
            <span>현재 수강 중</span>
          </div>
          <div className="learner-stat">
            <Award size={23} />
            <strong>
              {completed.length}
              <small>개</small>
            </strong>
            <span>수료한 과정</span>
          </div>
        </div>
      </section>
      <div className="learning-insights">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h3>과정별 학습 진행률</h3>
            <ChartNoAxesCombined size={19} />
          </div>
          <p className="panel-description">
            과정별 수료 기준과 현재 진도를 확인합니다.
          </p>
          {courses.length ? (
            <div className="course-progress-bars">
              {courses.map((c) => (
                <div key={c.id}>
                  <div>
                    <span>{c.title}</span>
                    <b>{c.progress}%</b>
                  </div>
                  <div
                    className="course-bar"
                    role="progressbar"
                    aria-label={`${c.title} 진도`}
                    aria-valuenow={c.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <i style={{ width: `${c.progress}%` }} />
                    <span
                      style={{ left: `${c.completion_threshold}%` }}
                      title={`수료 기준 ${c.completion_threshold}%`}
                    />
                  </div>
                  <small>
                    {c.completed_lessons}/{c.lesson_count}차시 완료 · 수료 기준{" "}
                    {c.completion_threshold}%
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              신청한 과정의 진도가 표시됩니다.
            </div>
          )}
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h3>최근 7일 학습 활동</h3>
            <Clock size={18} />
          </div>
          <p className="panel-description">
            실제 학습 기록에 기반한 일별 시청시간입니다.
          </p>
          <div
            className="activity-chart"
            role="img"
            aria-label={`최근 7일 학습 ${daily.map((d) => `${d.day} ${Math.round(d.seconds / 60)}분`).join(", ")}`}
          >
            {daily.map((d) => (
              <div key={d.day}>
                <span>
                  {d.seconds > 0 ? `${Math.round(d.seconds / 60)}분` : "0"}
                </span>
                <div>
                  <i
                    style={{
                      height: `${d.seconds > 0 ? Math.max(5, (d.seconds / maxDaily) * 100) : 0}%`,
                    }}
                  />
                </div>
                <small>
                  {new Date(`${d.day}T12:00:00+09:00`).toLocaleDateString(
                    "ko-KR",
                    {
                      month: "numeric",
                      day: "numeric",
                      timeZone: "Asia/Seoul",
                    },
                  )}
                </small>
              </div>
            ))}
          </div>
        </section>
      </div>
      {recent && (
        <section className="continue-learning">
          <div className="continue-icon">
            <Play size={27} />
          </div>
          <div>
            <span className="eyebrow">CONTINUE LEARNING</span>
            <h3>{next?.title ?? recent.title}</h3>
            <p>
              {recent.title} ·{" "}
              {next
                ? `${next.position}차시 · ${Math.ceil(next.duration_seconds / 60)}분`
                : "과정 안내"}{" "}
              · 현재 진도 {recent.progress}%
            </p>
          </div>
          <Link
            href={`/learn/${recent.slug}${next ? `?lesson=${next.id}` : ""}`}
            className="button primary"
          >
            이어서 학습하기 <Play size={15} />
          </Link>
        </section>
      )}
      <section className="dashboard-section" id="my-courses">
        <div className="panel-heading">
          <h2>나의 수강과정</h2>
          <span>{courses.length}개 과정</span>
        </div>
        <div className="learner-tabs" role="tablist" aria-label="수강 상태">
          {["전체", "수강 중", "수료", "기간 종료"].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {list.length ? (
          <div className="learner-course-grid">
            {list.map((c) => {
              const expired = new Date(c.expires_at).getTime() <= now;
              const days = Math.max(
                0,
                Math.ceil((new Date(c.expires_at).getTime() - now) / 86400000),
              );
              return (
                <article className="learner-course-card" key={c.id}>
                  <div className="learner-course-cover">
                    <BookOpen size={37} strokeWidth={1} />
                    <span>{c.category}</span>
                    <b>
                      {c.status === "completed"
                        ? "수료"
                        : expired
                          ? "기간 종료"
                          : `D-${days}`}
                    </b>
                  </div>
                  <div className="learner-course-body">
                    <h3>{c.title}</h3>
                    <p>
                      {c.instructor || "강사 안내 준비 중"} · {c.lesson_count}개
                      차시
                    </p>
                    <div className="learner-course-progress">
                      <span>학습 진도</span>
                      <strong>{c.progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${c.progress}%` }} />
                    </div>
                    <dl>
                      <dt>수강기간</dt>
                      <dd>
                        {new Date(c.enrolled_at).toLocaleDateString("ko-KR")} ~{" "}
                        {new Date(c.expires_at).toLocaleDateString("ko-KR")}
                      </dd>
                      <dt>완료 차시</dt>
                      <dd>
                        {c.completed_lessons}/{c.lesson_count}차시 · 기준{" "}
                        {c.completion_threshold}%
                      </dd>
                      <dt>최근 학습</dt>
                      <dd>
                        {c.last_studied_at
                          ? new Date(c.last_studied_at).toLocaleDateString(
                              "ko-KR",
                            )
                          : "학습 시작 전"}
                      </dd>
                    </dl>
                    <div className="actions">
                      {!expired && (
                        <Link
                          className="button primary"
                          href={`/learn/${c.slug}`}
                        >
                          강의실 입장 <ArrowUpRight size={15} />
                        </Link>
                      )}
                      <a
                        href={`/api/courses/${c.id}/syllabus`}
                        className="button outline"
                      >
                        <FileDown size={15} />
                        강의계획 PDF
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>
              {courses.length
                ? "해당 상태의 과정이 없습니다."
                : "아직 신청한 과정이 없습니다."}
            </h3>
            <p>교육과정에서 관심 있는 분야를 살펴보세요.</p>
            <Link className="text-link" href="/courses">
              교육과정 찾아보기 →
            </Link>
          </div>
        )}
      </section>
      <section className="dashboard-section" id="lesson-status">
        <div className="panel-heading">
          <h2>차시별 학습 현황</h2>
          <label className="dashboard-select">
            과정 선택
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {lessonList.length ? (
          <div className="table-wrap learner-table">
            <table>
              <thead>
                <tr>
                  <th>차시</th>
                  <th>강의명</th>
                  <th>분량</th>
                  <th>인정시간</th>
                  <th>진도</th>
                  <th>상태</th>
                  <th>학습</th>
                </tr>
              </thead>
              <tbody>
                {lessonList.map((l) => {
                  const progress = l.duration_seconds
                    ? Math.min(
                        100,
                        Math.floor(
                          (l.watched_seconds / l.duration_seconds) * 100,
                        ),
                      )
                    : 0;
                  return (
                    <tr key={l.id}>
                      <td>{String(l.position).padStart(2, "0")}</td>
                      <td className="title-cell">{l.title}</td>
                      <td>
                        {l.duration_seconds < 60
                          ? `${l.duration_seconds}초`
                          : `${Math.ceil(l.duration_seconds / 60)}분`}
                      </td>
                      <td>{Math.floor(l.watched_seconds)}초</td>
                      <td>{progress}%</td>
                      <td>
                        <span
                          className={`learning-status ${progress >= (course?.completion_threshold ?? 90) ? "done" : ""}`}
                        >
                          {progress >= (course?.completion_threshold ?? 90)
                            ? "학습 완료"
                            : progress > 0
                              ? "학습 중"
                              : "미수강"}
                        </span>
                      </td>
                      <td>
                        {l.video_status === "ready" ? (
                          <Link href={`/learn/${course?.slug}?lesson=${l.id}`}>
                            학습하기 →
                          </Link>
                        ) : (
                          "영상 준비 중"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dashboard-empty">
            과정을 신청하면 차시별 현황이 표시됩니다.
          </p>
        )}
      </section>
      <section className="dashboard-section" id="documents">
        <div className="panel-heading">
          <h2>수료·발급문서</h2>
          <Award size={22} />
        </div>
        <p className="panel-description">
          수료한 과정의 증명서를 PDF로 저장하거나 재출력합니다. 자격증은
          관리자가 발급 기준을 확인한 뒤 표시됩니다.
        </p>
        <div className="completion-options">
          {completed.map((c) => (
            <div key={c.id}>
              <CheckCircle2 size={20} />
              <span>
                <b>{c.title}</b>
                <small>
                  {c.completed_at
                    ? new Date(c.completed_at).toLocaleDateString("ko-KR")
                    : ""}{" "}
                  수료
                </small>
              </span>
              <form action="/api/documents/issue" method="post">
                <input type="hidden" name="courseId" value={c.id} />
                <button className="button outline">
                  수료증 PDF 발급 <FileDown size={15} />
                </button>
              </form>
            </div>
          ))}
        </div>
        {documents.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>문서 종류</th>
                  <th>과정</th>
                  <th>발급번호</th>
                  <th>발급일</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.kind === "completion" ? "수료증" : "자격증"}</td>
                    <td>{d.title}</td>
                    <td>{d.document_number}</td>
                    <td>{new Date(d.issued_at).toLocaleDateString("ko-KR")}</td>
                    <td>
                      <a
                        href={`/api/documents/${d.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        저장·재출력 ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard-empty">
            <Award size={26} />
            <p>
              아직 발급된 문서가 없습니다.
              <br />
              과정을 수료하면 발급 가능한 문서를 확인할 수 있습니다.
            </p>
          </div>
        )}
      </section>
      <div className="learning-bottom-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h3>학습 이용 안내</h3>
            <BookOpen size={18} />
          </div>
          <ol className="learning-guide">
            <li>
              <span>01</span>
              <div>
                <b>실제 시청한 구간이 진도가 됩니다.</b>
                <p>
                  건너뛴 구간, 일시정지 시간과 중복 구간은 진도로 누적하지
                  않습니다.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <b>마지막 학습 위치에서 이어갑니다.</b>
                <p>
                  주기적으로 저장되는 학습 기록을 기반으로 이어보기를
                  제공합니다.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <b>과정별 수료 기준을 확인하세요.</b>
                <p>
                  기본 90% 기준이며 과정별 기준은 수강 안내와 현황에 표시합니다.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h3>공지·학습지원</h3>
            <Bell size={18} />
          </div>
          {notices.map((n) => (
            <Link href={`/news/${n.id}`} key={n.id} className="learner-notice">
              {n.title}
              <ArrowUpRight size={15} />
            </Link>
          ))}
          <Link href="/contact?kind=education" className="learning-help">
            <span>
              <b>학습 중 도움이 필요하신가요?</b>
              <small>영상 재생·과정 이용·계정 문의</small>
            </span>
            <ArrowUpRight size={21} />
          </Link>
        </section>
      </div>
    </div>
  );
}

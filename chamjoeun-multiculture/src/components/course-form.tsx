import { ActionForm } from "@/components/form";
import { saveCourse } from "@/app/admin/actions";
import type { Course } from "@/lib/data";
export function CourseForm({ course }: { course?: Course }) {
  return (
    <ActionForm action={saveCourse} label="과정 저장">
      {course && <input name="id" type="hidden" value={course.id} />}
      <label>
        과정명
        <input
          name="title"
          required
          minLength={2}
          maxLength={150}
          defaultValue={course?.title}
        />
      </label>
      <label>
        과정 주소
        <input
          name="slug"
          placeholder="lifelong-basic"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          maxLength={100}
          defaultValue={course?.slug}
        />
      </label>
      <label>
        분야
        <select name="category" defaultValue={course?.category ?? "평생교육"}>
          {["평생교육", "민간자격과정", "한국어교육", "기타"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        짧은 소개
        <input
          name="summary"
          required
          minLength={5}
          maxLength={300}
          defaultValue={course?.summary}
        />
      </label>
      <label>
        상세 소개
        <textarea
          name="description"
          maxLength={10000}
          defaultValue={course?.description}
        />
      </label>
      <label>
        강사
        <input
          name="instructor"
          maxLength={60}
          defaultValue={course?.instructor}
        />
      </label>
      <div className="split">
        <label>
          수강료 (원)
          <input
            name="price"
            type="number"
            min={0}
            max={10000000}
            defaultValue={course?.price ?? 0}
            required
          />
        </label>
        <label>
          수강기간 (일)
          <input
            name="duration_days"
            type="number"
            min={1}
            max={3650}
            defaultValue={course?.duration_days ?? 90}
            required
          />
        </label>
      </div>
      <label>
        수료 기준 (%)
        <input
          name="completion_threshold"
          type="number"
          min={1}
          max={100}
          defaultValue={course?.completion_threshold ?? 90}
          required
        />
        <small>
          변경된 기준은 이후 학습 기록 저장 시 적용됩니다. 기존 수료를 소급
          취소하지 않습니다.
        </small>
      </label>
      <label>
        공개 상태
        <select name="status" defaultValue={course?.status ?? "draft"}>
          <option value="draft">작성 중</option>
          <option value="published">공개</option>
          <option value="archived">보관</option>
        </select>
      </label>
    </ActionForm>
  );
}

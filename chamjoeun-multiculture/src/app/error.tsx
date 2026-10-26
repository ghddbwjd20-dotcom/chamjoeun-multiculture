"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="error-page">
      <h1>잠시 연결이 원활하지 않습니다.</h1>
      <p>다시 시도하거나 기관에 문의해 주세요.</p>
      <button onClick={reset} className="button primary">
        다시 시도
      </button>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
export type NewsItem = {
  id: string;
  title: string;
  category: string;
  created_at: string;
};
export function NewsTabs({ posts }: { posts: NewsItem[] }) {
  const [category, setCategory] = useState("공지사항");
  const list = posts.filter((p) => p.category === category).slice(0, 4);
  return (
    <div className="home-board">
      <div role="tablist" aria-label="기관소식 분류" className="news-tabs">
        {["공지사항", "사업소식", "자료실"].map((c, i) => (
          <button
            role="tab"
            id={`news-tab-${i}`}
            aria-controls="home-news-panel"
            aria-selected={category === c}
            key={c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
        <Link
          href={`/news?category=${category}`}
          aria-label={`${category} 전체 보기`}
        >
          <Plus size={20} />
        </Link>
      </div>
      <div
        id="home-news-panel"
        role="tabpanel"
        aria-labelledby={`news-tab-${["공지사항", "사업소식", "자료실"].indexOf(category)}`}
      >
        {list.length ? (
          list.map((p) => (
            <Link className="home-news-row" href={`/news/${p.id}`} key={p.id}>
              <span>{p.title}</span>
              <time>
                {new Date(p.created_at).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </time>
              <ArrowUpRight size={16} />
            </Link>
          ))
        ) : (
          <div className="home-news-empty">
            <span>
              새로운 {category === "자료실" ? "자료" : "소식"}을 준비하고
              있습니다.
            </span>
            <p>게시된 내용은 이곳에서 바로 확인하실 수 있습니다.</p>
          </div>
        )}
      </div>
      <Link href={`/news?category=${category}`} className="text-link">
        {category} 전체 보기 <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}

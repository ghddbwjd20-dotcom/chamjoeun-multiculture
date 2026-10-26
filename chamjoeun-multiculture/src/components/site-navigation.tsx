"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { navigation } from "@/lib/navigation";
export function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  return (
    <div
      className={`navigation-shell ${open ? "is-open" : ""}`}
      ref={shell}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <nav
        className="desktop-nav"
        aria-label="주요 메뉴"
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
      >
        {navigation.slice(0, 5).map((g) => (
          <Link href={g.href} key={g.title} onClick={() => setOpen(false)}>
            {g.title}
          </Link>
        ))}
      </nav>
      <Link
        href="/contact"
        className="nav-inquiry-button"
        onClick={() => setOpen(false)}
      >
        문의 <ArrowUpRight size={16} />
      </Link>
      <button
        className="all-menu-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="all-site-menu"
        aria-label={open ? "전체 메뉴 닫기" : "전체 메뉴 열기"}
      >
        {open ? <X size={23} /> : <Menu size={23} />}
        <span>전체메뉴</span>
      </button>
      <div
        className="mega-menu"
        id="all-site-menu"
        hidden={!open}
        onMouseEnter={() => setOpen(true)}
      >
        <div className="container mega-inner">
          <div className="mega-intro">
            <span className="eyebrow">CHAMJOEUN GUIDE</span>
            <h2>
              필요한 서비스를
              <br />
              한눈에.
            </h2>
            <p>
              배움에서 정착까지,
              <br />
              참조은다문화가 함께합니다.
            </p>
            <Link href="/contact" onClick={() => setOpen(false)}>
              이용 문의 <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mega-columns">
            {navigation.map((g) => (
              <section key={g.title}>
                <Link
                  href={g.href}
                  className="mega-title"
                  onClick={() => setOpen(false)}
                >
                  {g.title}
                </Link>
                {g.items.map(([label, href]) => (
                  <Link key={label} href={href} onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
      {open && (
        <button
          className="menu-scrim"
          aria-label="전체 메뉴 닫기"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

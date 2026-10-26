"use client";
import { useState } from "react";
import { MessageCircle, Phone, X, ArrowUpRight } from "lucide-react";
export function ContactWidgets({kakaoUrl}:{kakaoUrl:string}) {
  const [open,setOpen]=useState(false);
  const channel=/^https:\/\/pf\.kakao\.com\/[A-Za-z0-9_/-]+$/.test(kakaoUrl)?kakaoUrl:"";
  return <aside className="contact-widgets" aria-label="빠른 상담">
    {open && <section className="quick-contact-panel" aria-labelledby="quick-contact-title">
      <button className="quick-contact-close" onClick={()=>setOpen(false)} aria-label="상담 안내 닫기"><X size={18}/></button>
      <span className="eyebrow">HOW CAN WE HELP?</span><h2 id="quick-contact-title">카카오 상담</h2>
      <p>카카오 채널 연결을 준비 중입니다.<br/>전화 또는 온라인 문의를 이용해 주세요.</p>
      <a href="/contact">온라인 문의 남기기 <ArrowUpRight size={17}/></a>
      <a href="tel:0515585629">051-558-5629 <Phone size={16}/></a>
    </section>}
    {channel ? <a className="quick-contact-button kakao" href={channel} target="_blank" rel="noopener noreferrer" aria-label="카카오 채널 상담 (새 창)"><MessageCircle size={23} fill="currentColor"/><span>카카오 상담</span></a> : <button className="quick-contact-button kakao" onClick={()=>setOpen(!open)} aria-expanded={open}><MessageCircle size={23} fill="currentColor"/><span>카카오 상담</span></button>}
    <a className="quick-contact-button telephone" href="tel:0515585629" aria-label="전화 상담 051-558-5629"><Phone size={22}/><span>전화 상담</span></a>
  </aside>;
}

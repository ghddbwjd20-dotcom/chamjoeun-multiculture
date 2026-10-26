import {
  Building2,
  BookOpen,
  Globe2,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const Icon = eyebrow.includes("ADMIN")
    ? LayoutDashboard
    : eyebrow.includes("CLASS") || eyebrow.includes("LEARN")
      ? GraduationCap
      : eyebrow.includes("ABOUT")
        ? Building2
        : eyebrow.includes("CONTACT")
          ? MessageSquare
          : eyebrow.includes("NEWS")
            ? Newspaper
            : eyebrow.includes("PRIVACY") || eyebrow.includes("TERMS")
              ? ShieldCheck
              : eyebrow.includes("SETTLEMENT")
                ? Globe2
                : BookOpen;
  return (
    <section className="page-heading">
      <div className="container page-heading-layout">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="page-heading-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-card back" />
          <div className="art-card">
            <Icon size={58} strokeWidth={1} />
          </div>
          <span className="art-dot" />
        </div>
      </div>
    </section>
  );
}

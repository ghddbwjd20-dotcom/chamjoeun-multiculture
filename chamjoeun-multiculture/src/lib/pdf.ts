import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const navy = rgb(0.09, 0.2, 0.31),
  muted = rgb(0.4, 0.48, 0.56),
  line = rgb(0.82, 0.86, 0.9);
async function setup() {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
    await readFile(resolve("public/fonts/NanumMyeongjo-Regular.ttf")),
    { subset: true },
  );
  return { pdf, font };
}
function lines(text: string, font: PDFFont, size: number, maxWidth: number) {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    let current = "";
    for (const char of paragraph) {
      if (current && font.widthOfTextAtSize(current + char, size) > maxWidth) {
        result.push(current);
        current = char;
      } else current += char;
    }
    result.push(current);
  }
  return result;
}
function drawLines(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  width: number,
  lineHeight = size * 1.7,
  color = navy,
) {
  for (const item of lines(text, font, size, width)) {
    page.drawText(item, { x, y, font, size, color });
    y -= lineHeight;
  }
  return y;
}
function center(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color = navy,
) {
  page.drawText(text, {
    x: (595.28 - font.widthOfTextAtSize(text, size)) / 2,
    y,
    font,
    size,
    color,
  });
}
export type DocumentSnapshot = {
  name: string;
  courseTitle: string;
  issuer: string;
  title: string;
  footer: string;
  completedAt: string;
  enrolledAt: string;
  expiresAt: string;
  issuedAt: string;
  number: string;
  version: number;
  preview: boolean;
};
export async function certificatePdf(data: DocumentSnapshot) {
  const { pdf, font } = await setup();
  const page = pdf.addPage([595.28, 841.89]);
  pdf.setTitle(`${data.title} - ${data.number}`);
  pdf.setAuthor(data.issuer);
  page.drawRectangle({
    x: 27,
    y: 27,
    width: 541.28,
    height: 787.89,
    borderWidth: 1,
    borderColor: line,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: 527.28,
    height: 773.89,
    borderWidth: 0.5,
    borderColor: line,
  });
  page.drawText("CHAMJOEUN MULTICULTURE", {
    x: 64,
    y: 758,
    font,
    size: 9,
    color: muted,
  });
  page.drawText(data.number, { x: 64, y: 736, font, size: 9, color: muted });
  center(page, data.title, font, 34, 649);
  page.drawLine({
    start: { x: 257, y: 620 },
    end: { x: 338, y: 620 },
    thickness: 1,
    color: line,
  });
  page.drawText("성명", { x: 75, y: 555, font, size: 11, color: muted });
  drawLines(page, data.name, font, 21, 155, 553, 350, 29);
  page.drawText("교육과정", { x: 75, y: 493, font, size: 11, color: muted });
  const afterTitle = drawLines(
    page,
    data.courseTitle,
    font,
    18,
    155,
    491,
    355,
    29,
  );
  const y = Math.min(425, afterTitle - 20);
  page.drawText("수료일", { x: 75, y, font, size: 11, color: muted });
  page.drawText(
    new Date(data.completedAt).toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
    }),
    { x: 155, y, font, size: 13, color: navy },
  );
  drawLines(page, data.footer, font, 14, 75, 340, 445, 28);
  center(
    page,
    new Date(data.issuedAt).toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
    }),
    font,
    14,
    225,
  );
  center(page, data.issuer, font, 22, 163);
  page.drawText(`발급번호 ${data.number} · 양식 버전 ${data.version}`, {
    x: 64,
    y: 83,
    font,
    size: 8,
    color: muted,
  });
  if (data.preview) {
    center(
      page,
      "개발 확인용 · 공식 증명서가 아닙니다",
      font,
      12,
      115,
      rgb(0.65, 0.26, 0.23),
    );
  }
  return pdf.save();
}
export async function syllabusPdf(
  course: {
    title: string;
    description: string;
    instructor: string;
    completion_threshold: number;
    duration_days: number;
  },
  lessons: { title: string; position: number; duration_seconds: number }[],
) {
  const { pdf, font } = await setup();
  let page = pdf.addPage([595.28, 841.89]),
    y = 760;
  page.drawText("강의계획서", { x: 55, y, font, size: 28, color: navy });
  y = drawLines(page, course.title, font, 19, 55, y - 50, 485, 28) - 25;
  y =
    drawLines(
      page,
      `강사: ${course.instructor || "운영 안내 준비 중"}\n수강기간: 신청 후 ${course.duration_days}일\n수료 기준: 실제 시청 구간 기준 ${course.completion_threshold}%`,
      font,
      11,
      55,
      y,
      485,
      22,
    ) - 20;
  y = drawLines(page, course.description, font, 11, 55, y, 485, 20) - 30;
  for (const lesson of lessons) {
    const text = `${String(lesson.position).padStart(2, "0")}  ${lesson.title}   (${lesson.duration_seconds < 60 ? `${lesson.duration_seconds}초` : `${Math.ceil(lesson.duration_seconds / 60)}분`})`;
    const parts = lines(text, font, 11, 485);
    if (y - parts.length * 20 < 70) {
      page = pdf.addPage([595.28, 841.89]);
      y = 765;
    }
    y = drawLines(page, text, font, 11, 55, y, 485, 20) - 13;
  }
  for (const [i, p] of pdf.getPages().entries()) {
    p.drawText(`참조은다문화(주) · ${i + 1} / ${pdf.getPageCount()}`, {
      x: 55,
      y: 35,
      font,
      size: 8,
      color: muted,
    });
  }
  return pdf.save();
}

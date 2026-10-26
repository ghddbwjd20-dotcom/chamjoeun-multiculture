export const boardCategories = [
  "공지사항",
  "사업소식",
  "행사사진",
  "자료실",
  "업무협약",
] as const;
export function boardCategory(value?: string): string {
  return boardCategories.includes(value as (typeof boardCategories)[number])
    ? value!
    : "전체";
}
export function pageNumber(value?: string) {
  const n = Number(value ?? 1);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
}

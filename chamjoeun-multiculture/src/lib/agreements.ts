export function formatAgreementDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return day ? `${year}년 ${month}월 ${day}일` : `${year}년 ${month}월`;
}

import { query } from "@/lib/db";
import { cache } from "react";
export type ContactSettings = {
  name: string;
  phone: string;
  email: string;
  address: string;
  privacyOfficer: string;
};
export const contactSettings = cache(async (): Promise<ContactSettings> => {
  const [s] = await query(
    "SELECT value FROM site_settings WHERE key='contact'",
  );
  if (!s)
    throw new Error(
      "기관 기본정보가 없습니다. DB 마이그레이션을 확인해 주세요.",
    );
  return s.value;
});

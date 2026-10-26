import { query } from "@/lib/db";
export type ContactSettings = {
  name: string;
  phone: string;
  email: string;
  address: string;
  privacyOfficer: string;
};
export async function contactSettings(): Promise<ContactSettings> {
  const [s] = await query(
    "SELECT value FROM site_settings WHERE key='contact'",
  );
  return s.value;
}

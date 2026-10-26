export function mailPreview() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_EMAIL_PREVIEW === "true"
  );
}
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}
export async function sendEmail(to: string, subject: string, text: string) {
  if (!mailConfigured()) throw new Error("Email provider is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(`Email delivery failed: ${response.status}`);
}

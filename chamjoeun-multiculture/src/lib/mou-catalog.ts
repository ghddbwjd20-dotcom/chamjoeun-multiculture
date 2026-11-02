import { z } from "zod";
import { formatAgreementDate } from "./agreements.ts";

function validDate(value: string) {
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return false;
  const [year, month, day = 1] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
const source = z.object({
  path: z
    .string()
    .min(1)
    .max(500)
    .refine(
      (value) =>
        !/^[\/]/.test(value) &&
        !/[\\:]/.test(value) &&
        value
          .split("/")
          .every(
            (segment) => segment !== ".." && segment !== "." && segment !== "",
          ),
    ),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const agreement = z.object({
  key: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  partner: z.string().min(2).max(200),
  signedOn: z.string().refine(validDate),
  title: z.string().min(2).max(150),
  parties: z.array(z.string().min(1).max(200)).min(2).max(20),
  scope: z.array(z.string().min(1).max(1000)).min(1).max(30),
  reviewStatus: z.enum(["reviewed", "needs_review"]),
  reviewNote: z.string().max(3000),
  sources: z.array(source).min(1).max(30),
});
export const mouCatalogSchema = z
  .object({
    reviewedOn: z.string().refine(validDate),
    agreements: z.array(agreement).min(1).max(1000),
    excludedFiles: z.array(z.string()),
  })
  .superRefine((catalog, context) => {
    const keys = new Set<string>();
    const paths = new Set<string>();
    for (const item of catalog.agreements) {
      if (keys.has(item.key))
        context.addIssue({
          code: "custom",
          message: `Duplicate agreement key: ${item.key}`,
        });
      keys.add(item.key);
      for (const file of item.sources) {
        if (paths.has(file.path))
          context.addIssue({
            code: "custom",
            message: `Duplicate source path: ${file.path}`,
          });
        paths.add(file.path);
      }
    }
  });
export type MouAgreement = z.infer<typeof agreement>;
export function agreementBody(item: MouAgreement) {
  return [
    `${item.partner} 관련 협약서에 기록된 협력 내용입니다.`,
    `협약일: ${formatAgreementDate(item.signedOn)}`,
    `협약 당사자: ${item.parties.join(" / ")}`,
    "협약서 주요 내용\n" +
      item.scope.map((scope, index) => `${index + 1}. ${scope}`).join("\n"),
  ].join("\n\n");
}

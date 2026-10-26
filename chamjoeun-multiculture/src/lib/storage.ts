import { S3Client } from "@aws-sdk/client-s3";
let client: S3Client | undefined;
export function storageConfigured() {
  return Boolean(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET,
  );
}
export function storage() {
  if (!storageConfigured())
    throw new Error("영상 스토리지가 설정되지 않았습니다.");
  return (client ??= new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  }));
}
export function videoBucket() {
  if (!process.env.S3_BUCKET) throw new Error("S3_BUCKET is missing");
  return process.env.S3_BUCKET;
}
export const uploadPartSize = 64 * 1024 * 1024;

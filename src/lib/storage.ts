import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
export interface ImageStorage {
  put(key: string, bytes: Buffer): Promise<string>;
  delete(key: string): Promise<void>;
}
function assertImageKey(key: string) {
  if (!/^[a-f0-9-]+\.webp$/.test(key)) throw new Error("Invalid image key.");
}
class LocalStorage implements ImageStorage {
  async put(key: string, bytes: Buffer) {
    assertImageKey(key);
    if (process.env.VERCEL) throw new Error("Configure S3 storage for Vercel.");
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, key), bytes, { flag: "wx" });
    return `/uploads/${key}`;
  }
  async delete(key: string) {
    assertImageKey(key);
    await unlink(path.join(process.cwd(), "public", "uploads", key));
  }
}
class S3Storage implements ImageStorage {
  private config() {
    const endpoint =
      process.env.STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3;
    const region =
      process.env.AWS_REGION || process.env.STORAGE_REGION || "auto";
    const bucket = process.env.STORAGE_BUCKET || "naranj-products";
    const accessKeyId =
      process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.STORAGE_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey)
      throw new Error("S3 storage is not configured.");
    return {
      endpoint,
      region,
      bucket,
      publicUrl:
        process.env.STORAGE_PUBLIC_URL ||
        `${endpoint.replace(/\/$/, "")}/${bucket}`,
      credentials: { accessKeyId, secretAccessKey },
    };
  }
  private client(config: ReturnType<S3Storage["config"]>) {
    return new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
      forcePathStyle: true,
    });
  }
  async put(key: string, bytes: Buffer) {
    assertImageKey(key);
    const config = this.config();
    await this.client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: bytes,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${config.publicUrl.replace(/\/$/, "")}/${key}`;
  }
  async delete(key: string) {
    assertImageKey(key);
    const config = this.config();
    await this.client(config).send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
  }
}
export function storage(): ImageStorage {
  return process.env.STORAGE_DRIVER === "s3"
    ? new S3Storage()
    : new LocalStorage();
}

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const keyB64 = this.config.get<string>("APP_ENC_KEY", "");
    if (!keyB64) throw new Error("APP_ENC_KEY is required");
    this.key = Buffer.from(keyB64, "base64");
    if (this.key.length !== 32) throw new Error("APP_ENC_KEY must be 32 bytes base64");
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
  }

  decrypt(enc: string): string {
    const [ivB64, tagB64, dataB64] = enc.split(":");
    if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted payload");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  }

  maskToken(token: string) {
    if (!token) return token;
    if (token.length <= 8) return "****";
    return `${token.slice(0, 4)}****${token.slice(-4)}`;
  }
}

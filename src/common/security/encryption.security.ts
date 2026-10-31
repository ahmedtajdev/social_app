import crypto from "node:crypto";
import { ENC_ALG, ENC_KEY, IV_LENGTH } from "../../config.js";

export const encrypt = async (plainText: string): Promise<string> => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipheriv = crypto.createCipheriv(ENC_ALG, ENC_KEY, iv);

  let encrypted = cipheriv.update(plainText, "utf-8", "hex");

  encrypted += cipheriv.final("hex");

  return `${iv.toString("hex")}::${encrypted}`;
};

export const decrypt = async (cipherText: string): Promise<string | null> => {
  if (!cipherText) return null;

  const [hexIV, encrypted] = cipherText.split("::") || [];

  const iv = Buffer.from(hexIV as string, "hex");

  const decipheriv = crypto.createDecipheriv(ENC_ALG, ENC_KEY, iv);

  let decrypted = decipheriv.update(encrypted as string, "hex", "utf-8");

  decrypted += decipheriv.final("utf-8");

  return decrypted;
};

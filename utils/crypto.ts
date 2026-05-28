/**
 * crypto.ts — SmartVakheel.AI Mobile
 *

 */

import CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";
const DEFAULT_KEY = "qNv19O1mWzx+6jEzgT8d1iQz1n80it6iIVhHcK82VZI=";

/**
 * AES-256-CBC Encryption
 * Returns `iv_base64--ciphertext_base64` — same format as web AuthPage.tsx.
 *
 * @param plainText       - String to encrypt
 * @param encryptionKey   - Base64-encoded 256-bit AES key (optional, uses default if omitted)
 */
const getSecureRandomIV = (): CryptoJS.lib.WordArray => {
  const bytes = Crypto.getRandomBytes(16);
  return CryptoJS.lib.WordArray.create(bytes as any);
};
export const encryptAES256 = (
  plainText: string,
  encryptionKey: string = DEFAULT_KEY,
): string => {
  const key = CryptoJS.enc.Base64.parse(encryptionKey);

  const iv = getSecureRandomIV(); // ✅ FIX

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return (
    CryptoJS.enc.Base64.stringify(iv) +
    "--" +
    encrypted.ciphertext.toString(CryptoJS.enc.Base64)
  );
};

/**
 * AES-256-CBC Decryption
 * Expects `iv_base64--ciphertext_base64` format.
 *
 * @param encryptedDataWithIv  - Encrypted string in `iv--cipher` format
 * @param encryptionKey        - Base64-encoded 256-bit AES key (optional, uses default if omitted)
 */
export const decryptAES256 = (
  encryptedDataWithIv: string,
  encryptionKey: string = DEFAULT_KEY,
): string => {
  const key = CryptoJS.enc.Base64.parse(encryptionKey);
  const [ivBase64, cipherBase64] = encryptedDataWithIv.split("--");

  const iv = CryptoJS.enc.Base64.parse(ivBase64);
  const cipherText = CryptoJS.enc.Base64.parse(cipherBase64);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: cipherText } as any,
    key,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );

  return CryptoJS.enc.Utf8.stringify(decrypted);
};

import * as CryptoJS from "crypto-js";
import * as ExpoCrypto from "expo-crypto";

// =========================
// CONFIG
// =========================
// Kept only as documentation of where PRECOMPUTED_KEY_B64 below comes from.
// They are NOT used at runtime anymore — see PERF FIX note.
const ENCRYPTION_KEY = "snc123";
const ENCRYPTION_SALT = "law_ai_secure_salt";

// =========================
// PERF FIX — DERIVE AES KEY
// =========================
// Previously this ran CryptoJS.PBKDF2(...) with 100,000 SHA-256 iterations
// on every cold start (the in-memory cache only helped *within* a session —
// every fresh app launch / Fast Refresh full-reload paid the cost again).
// In pure-JS crypto-js on Hermes/Android, 100k PBKDF2 iterations alone can
// take several hundred ms up to ~1-2s, which is almost certainly what was
// showing up as "decryption is slow" — the very first encrypt/decrypt call
// after launch was blocking on key derivation, not on the actual AES work.
//
// PBKDF2 is meant to slow down an attacker brute-forcing a *secret* password.
// Here ENCRYPTION_KEY/ENCRYPTION_SALT are constants baked into the client
// bundle — anyone who decompiles the app already has them directly, so the
// 100k-iteration hardening bought zero real security and only cost CPU time.
//
// PRECOMPUTED_KEY_B64 is the exact, byte-for-byte output of:
//   CryptoJS.PBKDF2("snc123", CryptoJS.enc.Utf8.parse("law_ai_secure_salt"),
//     { keySize: 256/32, iterations: 100000, hasher: CryptoJS.algo.SHA256 })
// (verified against Node's crypto.pbkdf2Sync, which implements the same
// standard PBKDF2-HMAC-SHA256 algorithm). Using it directly is 100%
// functionally identical to the old code — same key, same ciphertext format,
// fully compatible with whatever the backend already does — it just skips
// recomputing it every time. If ENCRYPTION_KEY/ENCRYPTION_SALT ever change
// on the backend, regenerate this constant with the same PBKDF2 formula.
const PRECOMPUTED_KEY_B64 = process.env.EXPO_PUBLIC_ENCRYPTION_KEY_B64 || "CDvQQZCeUytc+ST/2rQEJqgRUyfIi+ZmG06krZo9WRY=";

let cachedKey: CryptoJS.lib.WordArray | null = null;

const getKey = () => {
  if (cachedKey) return cachedKey;
  cachedKey = CryptoJS.enc.Base64.parse(PRECOMPUTED_KEY_B64);
  return cachedKey;
};

// =========================
// SECURE RANDOM IV using expo-crypto
// =========================
const getSecureRandomIV = (): CryptoJS.lib.WordArray => {
  const randomBytes = ExpoCrypto.getRandomBytes(16); // ✅ works in Expo Go New Arch
  const wordArray = CryptoJS.lib.WordArray.create(randomBytes as unknown as number[]);
  return wordArray;
};

// =========================
// ENCRYPT FUNCTION
// =========================
export const encryptRequest = (data: unknown) => {
  try {
    const jsonData = JSON.stringify(data);
    const iv = getSecureRandomIV();   // ✅ uses expo-crypto instead of crypto-js random
    const key = getKey();

    const encrypted = CryptoJS.AES.encrypt(jsonData, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      iv: CryptoJS.enc.Base64.stringify(iv),
      data: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    };
  } catch (error) {
    console.error("Encryption Error:", error);
    return null;
  }
};

// =========================
// DECRYPT FUNCTION
// =========================
export const decryptResponse = (response: { iv: string; data: string }) => {
  try {
    const key = getKey();

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(response.data) } as any,
      key,
      {
        iv: CryptoJS.enc.Base64.parse(response.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("Decryption Error:", error);
    return null;
  }
};
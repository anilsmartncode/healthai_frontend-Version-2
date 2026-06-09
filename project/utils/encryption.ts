import * as CryptoJS from "crypto-js";
import * as ExpoCrypto from "expo-crypto";

// =========================
// CONFIG
// =========================
const ENCRYPTION_KEY = "snc123";
const ENCRYPTION_SALT = "law_ai_secure_salt";

// =========================
// DERIVE AES KEY
// =========================
const getKey = () => {
  return CryptoJS.PBKDF2(
    ENCRYPTION_KEY,
    CryptoJS.enc.Utf8.parse(ENCRYPTION_SALT),
    {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256,
    }
  );
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
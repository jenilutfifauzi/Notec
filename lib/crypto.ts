import { Platform } from 'react-native';
import {
  AESEncryptionKey,
  AESSealedData,
  aesEncryptAsync,
  aesDecryptAsync,
  getRandomBytes as expoGetRandomBytes,
  digest as expoDigestAsync,
  CryptoDigestAlgorithm,
} from 'expo-crypto';
import ExpoCryptoModule from 'expo-crypto/build/ExpoCrypto';

const NATIVE_PBKDF2_ITERATIONS = 100_000;
const WEB_PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ITERATION_LENGTH = 4;
const HEADER_LENGTH = SALT_LENGTH + ITERATION_LENGTH + IV_LENGTH; // 32 bytes
const MIN_BACKUP_LENGTH = HEADER_LENGTH + TAG_LENGTH; // 48 bytes

function getSecureRandomBytes(length: number): Uint8Array {
  if (Platform.OS === 'web') {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(length));
    }
  }
  return expoGetRandomBytes(length);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * PBKDF2-HMAC-SHA256 synchronous implementation using native ExpoCryptoModule.digest JSI
 * Pre-allocates and reuses buffers for minimal garbage collection overhead across iterations.
 */
function pbkdf2HmacSha256Sync(
  passwordBytes: Uint8Array,
  saltBytes: Uint8Array,
  iterations: number,
  dkLen: number = 32
): Uint8Array {
  const k0 = new Uint8Array(64);
  if (passwordBytes.length > 64) {
    const hash = new Uint8Array(32);
    ExpoCryptoModule.digest('SHA-256', hash, passwordBytes);
    k0.set(hash);
  } else {
    k0.set(passwordBytes);
  }

  const kIpad = new Uint8Array(64);
  const kOpad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    kIpad[i] = k0[i] ^ 0x36;
    kOpad[i] = k0[i] ^ 0x5c;
  }

  const innerHash = new Uint8Array(32);
  const outerData = new Uint8Array(64 + 32);
  outerData.set(kOpad, 0);

  // U1 = HMAC(password, salt || INT_32_BE(1))
  const u1Inner = new Uint8Array(64 + saltBytes.length + 4);
  u1Inner.set(kIpad, 0);
  u1Inner.set(saltBytes, 64);
  u1Inner[64 + saltBytes.length + 3] = 1;

  ExpoCryptoModule.digest('SHA-256', innerHash, u1Inner);
  outerData.set(innerHash, 64);
  const uPrev = new Uint8Array(32);
  ExpoCryptoModule.digest('SHA-256', uPrev, outerData);

  const result = new Uint8Array(32);
  result.set(uPrev);

  if (iterations > 1) {
    const innerData = new Uint8Array(64 + 32);
    innerData.set(kIpad, 0);
    const uCurr = new Uint8Array(32);

    for (let i = 1; i < iterations; i++) {
      innerData.set(uPrev, 64);
      ExpoCryptoModule.digest('SHA-256', innerHash, innerData);

      outerData.set(innerHash, 64);
      ExpoCryptoModule.digest('SHA-256', uCurr, outerData);

      for (let j = 0; j < 32; j++) {
        result[j] ^= uCurr[j];
      }
      uPrev.set(uCurr);
    }
  }

  return result.subarray(0, dkLen);
}

/**
 * Fallback asynchronous PBKDF2-HMAC-SHA256 if synchronous JSI digest is unavailable
 */
async function pbkdf2HmacSha256Async(
  passwordBytes: Uint8Array,
  saltBytes: Uint8Array,
  iterations: number,
  dkLen: number = 32
): Promise<Uint8Array> {
  const k0 = new Uint8Array(64);
  if (passwordBytes.length > 64) {
    const hashBuffer = await expoDigestAsync(
      CryptoDigestAlgorithm.SHA256,
      passwordBytes as unknown as BufferSource
    );
    k0.set(new Uint8Array(hashBuffer));
  } else {
    k0.set(passwordBytes);
  }

  const kIpad = new Uint8Array(64);
  const kOpad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    kIpad[i] = k0[i] ^ 0x36;
    kOpad[i] = k0[i] ^ 0x5c;
  }

  const outerData = new Uint8Array(64 + 32);
  outerData.set(kOpad, 0);

  const u1Inner = new Uint8Array(64 + saltBytes.length + 4);
  u1Inner.set(kIpad, 0);
  u1Inner.set(saltBytes, 64);
  u1Inner[64 + saltBytes.length + 3] = 1;

  let innerHashBuffer = await expoDigestAsync(
    CryptoDigestAlgorithm.SHA256,
    u1Inner as unknown as BufferSource
  );
  outerData.set(new Uint8Array(innerHashBuffer), 64);
  let outerHashBuffer = await expoDigestAsync(
    CryptoDigestAlgorithm.SHA256,
    outerData as unknown as BufferSource
  );
  let uPrev = new Uint8Array(outerHashBuffer);

  const result = new Uint8Array(32);
  result.set(uPrev);

  if (iterations > 1) {
    const innerData = new Uint8Array(64 + 32);
    innerData.set(kIpad, 0);

    for (let i = 1; i < iterations; i++) {
      innerData.set(uPrev, 64);
      innerHashBuffer = await expoDigestAsync(
        CryptoDigestAlgorithm.SHA256,
        innerData as unknown as BufferSource
      );

      outerData.set(new Uint8Array(innerHashBuffer), 64);
      outerHashBuffer = await expoDigestAsync(
        CryptoDigestAlgorithm.SHA256,
        outerData as unknown as BufferSource
      );
      const uCurr = new Uint8Array(outerHashBuffer);

      for (let j = 0; j < 32; j++) {
        result[j] ^= uCurr[j];
      }
      uPrev = uCurr;
    }
  }

  return result.subarray(0, dkLen);
}

async function deriveNativeKey(
  passwordBytes: Uint8Array,
  saltBytes: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  if (
    typeof ExpoCryptoModule !== 'undefined' &&
    ExpoCryptoModule !== null &&
    typeof ExpoCryptoModule.digest === 'function'
  ) {
    return pbkdf2HmacSha256Sync(passwordBytes, saltBytes, iterations, 32);
  }
  return await pbkdf2HmacSha256Async(passwordBytes, saltBytes, iterations, 32);
}

async function encryptBackupNative(
  dataBytes: Uint8Array,
  passwordBytes: Uint8Array
): Promise<string> {
  const salt = getSecureRandomBytes(SALT_LENGTH);
  const iv = getSecureRandomBytes(IV_LENGTH);

  const derivedKeyBytes = await deriveNativeKey(
    passwordBytes,
    salt,
    NATIVE_PBKDF2_ITERATIONS
  );

  const key = await AESEncryptionKey.import(derivedKeyBytes);
  const sealedData = await aesEncryptAsync(dataBytes, key, {
    nonce: { bytes: iv },
  });

  const ivAndCiphertext = await sealedData.combined('bytes');

  const combined = new Uint8Array(
    SALT_LENGTH + ITERATION_LENGTH + ivAndCiphertext.byteLength
  );
  combined.set(salt, 0);
  new DataView(
    combined.buffer,
    combined.byteOffset + SALT_LENGTH,
    ITERATION_LENGTH
  ).setUint32(0, NATIVE_PBKDF2_ITERATIONS, false);
  combined.set(ivAndCiphertext, SALT_LENGTH + ITERATION_LENGTH);

  return bytesToBase64(combined);
}

async function decryptBackupNative(
  combined: Uint8Array,
  passwordBytes: Uint8Array
): Promise<string> {
  const salt = combined.subarray(0, SALT_LENGTH);
  const iterations = new DataView(
    combined.buffer,
    combined.byteOffset + SALT_LENGTH,
    ITERATION_LENGTH
  ).getUint32(0, false);

  if (iterations < 1 || iterations > 5_000_000) {
    throw new Error('Format berkas cadangan rusak atau tidak valid');
  }

  const derivedKeyBytes = await deriveNativeKey(
    passwordBytes,
    salt,
    iterations
  );

  const key = await AESEncryptionKey.import(derivedKeyBytes);
  const sealedData = AESSealedData.fromCombined(
    combined.slice(SALT_LENGTH + ITERATION_LENGTH),
    { ivLength: IV_LENGTH, tagLength: TAG_LENGTH }
  );

  let decryptedBytes: Uint8Array;
  try {
    decryptedBytes = (await aesDecryptAsync(sealedData, key)) as Uint8Array;
  } catch {
    throw new Error('Sandi salah atau berkas cadangan rusak');
  }

  const dec = new TextDecoder();
  return dec.decode(decryptedBytes);
}

async function encryptBackupWeb(
  dataBytes: Uint8Array,
  passwordBytes: Uint8Array
): Promise<string> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (!subtle) {
    throw new Error('Web Crypto API tidak tersedia di lingkungan ini');
  }

  const salt = getSecureRandomBytes(SALT_LENGTH);
  const iv = getSecureRandomBytes(IV_LENGTH);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBytes as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: WEB_PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    dataBytes as unknown as BufferSource
  );

  const ciphertext = new Uint8Array(encryptedBuffer);

  const combined = new Uint8Array(HEADER_LENGTH + ciphertext.byteLength);
  combined.set(salt, 0);
  new DataView(
    combined.buffer,
    combined.byteOffset + SALT_LENGTH,
    ITERATION_LENGTH
  ).setUint32(0, WEB_PBKDF2_ITERATIONS, false);
  combined.set(iv, SALT_LENGTH + ITERATION_LENGTH);
  combined.set(ciphertext, HEADER_LENGTH);

  return bytesToBase64(combined);
}

async function decryptBackupWeb(
  combined: Uint8Array,
  passwordBytes: Uint8Array
): Promise<string> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (!subtle) {
    throw new Error('Web Crypto API tidak tersedia di lingkungan ini');
  }

  const salt = combined.subarray(0, SALT_LENGTH);
  const iterations = new DataView(
    combined.buffer,
    combined.byteOffset + SALT_LENGTH,
    ITERATION_LENGTH
  ).getUint32(0, false);

  if (iterations < 1 || iterations > 5_000_000) {
    throw new Error('Format berkas cadangan rusak atau tidak valid');
  }

  const iv = combined.subarray(SALT_LENGTH + ITERATION_LENGTH, HEADER_LENGTH);
  const ciphertext = combined.subarray(HEADER_LENGTH);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBytes as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );
  } catch {
    throw new Error('Sandi salah atau berkas cadangan rusak');
  }

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Encrypt a JSON string using password-derived AES-GCM key with PBKDF2
 * Output structure: salt (16B) || iterations (4B) || iv (12B) || ciphertext+tag, base64 encoded
 */
export async function encryptBackup(
  payloadJson: string,
  password: string
): Promise<string> {
  const enc = new TextEncoder();
  const passwordBytes = enc.encode(password);
  const dataBytes = enc.encode(payloadJson);

  if (Platform.OS === 'web') {
    return await encryptBackupWeb(dataBytes, passwordBytes);
  }
  return await encryptBackupNative(dataBytes, passwordBytes);
}

/**
 * Decrypt a base64 encoded backup string using password
 */
export async function decryptBackup(
  base64Data: string,
  password: string
): Promise<string> {
  const combined = base64ToBytes(base64Data.trim());

  if (combined.length < MIN_BACKUP_LENGTH) {
    throw new Error('Format berkas cadangan rusak atau tidak valid');
  }

  const enc = new TextEncoder();
  const passwordBytes = enc.encode(password);

  if (Platform.OS === 'web') {
    return await decryptBackupWeb(combined, passwordBytes);
  }
  return await decryptBackupNative(combined, passwordBytes);
}

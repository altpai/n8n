// Cryptographic utility functions using WebCrypto API

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert string to ArrayBuffer (UTF-8 encoding)
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

/**
 * Convert ArrayBuffer to string (UTF-8 decoding)
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Generate a cryptographically secure random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = generateRandomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Secure password generation with customizable character sets
 */
export interface PasswordGenerationOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export function generateSecurePassword(options: PasswordGenerationOptions): string {
  let charset = '';
  
  if (options.includeUppercase) {
    charset += options.excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (options.includeLowercase) {
    charset += options.excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (options.includeNumbers) {
    charset += options.excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (options.includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }
  
  if (charset === '') {
    throw new Error('At least one character type must be selected');
  }
  
  const randomBytes = generateRandomBytes(options.length);
  let password = '';
  
  for (let i = 0; i < options.length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Hash a string using SHA-256
 */
export async function sha256Hash(data: string): Promise<string> {
  const buffer = stringToArrayBuffer(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Generate a fingerprint for a public key
 */
export async function generateKeyFingerprint(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  const hash = await crypto.subtle.digest('SHA-256', exported);
  return arrayBufferToBase64(hash).substring(0, 16); // First 16 chars as fingerprint
}
// Core encryption/decryption functions using WebCrypto API

import type { EncryptedData, MasterKey, CryptoConfig } from '@/types/crypto';
import { DEFAULT_CRYPTO_CONFIG } from '@/types/crypto';
import {
  generateRandomBytes,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString,
} from './utils';

/**
 * Derive a master key from a password using PBKDF2
 */
export async function deriveMasterKey(
  password: string,
  salt?: Uint8Array,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<MasterKey> {
  const passwordBuffer = stringToArrayBuffer(password);
  const saltBytes = salt || generateRandomBytes(config.saltLength);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the master key using PBKDF2
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: config.pbkdf2Iterations,
      hash: 'SHA-256',
    } as Pbkdf2Params,
    keyMaterial,
    {
      name: 'AES-GCM',
      length: config.aesKeyLength,
    },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );
  
  return {
    key: masterKey,
    salt: arrayBufferToBase64(saltBytes.buffer as ArrayBuffer),
  };
}

/**
 * Encrypt data using AES-GCM with the provided key
 */
export async function encryptData(
  data: string,
  key: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<EncryptedData> {
  const iv = generateRandomBytes(config.ivLength);
  const dataBuffer = stringToArrayBuffer(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    } as AesGcmParams,
    key,
    dataBuffer
  );
  
  return {
    data: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    algorithm: 'AES-GCM',
  };
}

/**
 * Decrypt data using AES-GCM with the provided key
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  if (encryptedData.algorithm !== 'AES-GCM') {
    throw new Error(`Unsupported algorithm: ${encryptedData.algorithm}`);
  }
  
  const dataBuffer = base64ToArrayBuffer(encryptedData.data);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      } as AesGcmParams,
      key,
      dataBuffer
    );
    
    return arrayBufferToString(decryptedBuffer);
  } catch (error) {
    throw new Error('Failed to decrypt data: Invalid key or corrupted data');
  }
}

/**
 * Encrypt data with a password (convenience function)
 */
export async function encryptWithPassword(
  data: string,
  password: string,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<EncryptedData> {
  const masterKey = await deriveMasterKey(password, undefined, config);
  const encrypted = await encryptData(data, masterKey.key, config);
  
  return {
    ...encrypted,
    salt: masterKey.salt,
    keyDerivation: 'PBKDF2',
  };
}

/**
 * Decrypt data with a password (convenience function)
 */
export async function decryptWithPassword(
  encryptedData: EncryptedData,
  password: string,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<string> {
  if (!encryptedData.salt) {
    throw new Error('Salt is required for password-based decryption');
  }
  
  const saltBuffer = base64ToArrayBuffer(encryptedData.salt);
  const masterKey = await deriveMasterKey(password, new Uint8Array(saltBuffer), config);
  
  return decryptData(encryptedData, masterKey.key);
}

/**
 * Generate a random encryption key for vault data
 */
export async function generateVaultKey(
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: config.aesKeyLength,
    },
    true, // Extractable so we can encrypt it with user's master key
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a key to be stored (encrypted with master key)
 */
export async function exportKey(
  key: CryptoKey,
  masterKey: CryptoKey
): Promise<string> {
  const keyBuffer = await crypto.subtle.exportKey('raw', key);
  const keyData = arrayBufferToBase64(keyBuffer);
  const encryptedKey = await encryptData(keyData, masterKey);
  return JSON.stringify(encryptedKey);
}

/**
 * Import a key from storage (decrypt with master key)
 */
export async function importKey(
  encryptedKeyData: string,
  masterKey: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<CryptoKey> {
  const encryptedKey: EncryptedData = JSON.parse(encryptedKeyData);
  const keyData = await decryptData(encryptedKey, masterKey);
  const keyBuffer = base64ToArrayBuffer(keyData);
  
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: config.aesKeyLength,
    },
    true,
    ['encrypt', 'decrypt']
  );
}
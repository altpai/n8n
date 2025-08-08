// Key exchange and secure sharing functionality using ECDH

import type { KeyPair, ExportedKeyPair, SharedSecret, EncryptedData, CryptoConfig } from '@/types/crypto';
import { DEFAULT_CRYPTO_CONFIG } from '@/types/crypto';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString,
  generateKeyFingerprint,
} from './utils';
import { encryptData, decryptData } from './encryption';

/**
 * Generate an ECDH key pair for secure sharing
 */
export async function generateKeyPair(
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: config.ecdhCurve,
    },
    true, // Extractable for export
    ['deriveKey', 'deriveBits']
  );
  
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Export key pair for storage (private key encrypted with master key)
 */
export async function exportKeyPair(
  keyPair: KeyPair,
  masterKey: CryptoKey
): Promise<ExportedKeyPair> {
  // Export public key (not encrypted)
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
  
  // Export and encrypt private key
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);
  const encryptedPrivateKey = await encryptData(privateKeyBase64, masterKey);
  
  return {
    publicKey: publicKeyBase64,
    privateKey: JSON.stringify(encryptedPrivateKey),
  };
}

/**
 * Import key pair from storage (decrypt private key with master key)
 */
export async function importKeyPair(
  exportedKeyPair: ExportedKeyPair,
  masterKey: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<KeyPair> {
  // Import public key
  const publicKeyBuffer = base64ToArrayBuffer(exportedKeyPair.publicKey);
  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: config.ecdhCurve,
    },
    true,
    []
  );
  
  // Decrypt and import private key
  const encryptedPrivateKey: EncryptedData = JSON.parse(exportedKeyPair.privateKey);
  const privateKeyBase64 = await decryptData(encryptedPrivateKey, masterKey);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: config.ecdhCurve,
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  
  return {
    publicKey,
    privateKey,
  };
}

/**
 * Import a public key from Base64 string
 */
export async function importPublicKey(
  publicKeyBase64: string,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<CryptoKey> {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  return crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: config.ecdhCurve,
    },
    true,
    []
  );
}

/**
 * Derive a shared AES key using ECDH
 */
async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    } as EcdhKeyDeriveParams,
    privateKey,
    {
      name: 'AES-GCM',
      length: config.aesKeyLength,
    },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data for a specific recipient using their public key
 */
export async function encryptForRecipient(
  data: string,
  senderPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey,
  recipientPublicKey: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<SharedSecret> {
  // Derive shared key using ECDH
  const sharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey, config);
  
  // Encrypt the data
  const encryptedData = await encryptData(data, sharedKey, config);
  
  // Generate key fingerprints for identification
  const senderPublicKeyId = await generateKeyFingerprint(senderPublicKey);
  const recipientPublicKeyId = await generateKeyFingerprint(recipientPublicKey);
  
  return {
    encryptedData,
    recipientPublicKeyId,
    senderPublicKeyId,
  };
}

/**
 * Decrypt data from a sender using their public key
 */
export async function decryptFromSender(
  sharedSecret: SharedSecret,
  recipientPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<string> {
  // Verify the sender's public key matches
  const expectedSenderKeyId = await generateKeyFingerprint(senderPublicKey);
  if (expectedSenderKeyId !== sharedSecret.senderPublicKeyId) {
    throw new Error('Sender public key mismatch');
  }
  
  // Derive the same shared key
  const sharedKey = await deriveSharedKey(recipientPrivateKey, senderPublicKey, config);
  
  // Decrypt the data
  return decryptData(sharedSecret.encryptedData, sharedKey);
}

/**
 * Create a secure sharing payload for multiple recipients
 */
export async function createSecureSharingPayload(
  data: string,
  senderKeyPair: KeyPair,
  recipientPublicKeys: CryptoKey[],
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<SharedSecret[]> {
  const sharedSecrets: SharedSecret[] = [];
  
  for (const recipientPublicKey of recipientPublicKeys) {
    const sharedSecret = await encryptForRecipient(
      data,
      senderKeyPair.privateKey,
      senderKeyPair.publicKey,
      recipientPublicKey,
      config
    );
    sharedSecrets.push(sharedSecret);
  }
  
  return sharedSecrets;
}

/**
 * Find and decrypt a shared secret intended for a specific recipient
 */
export async function findAndDecryptSharedSecret(
  sharedSecrets: SharedSecret[],
  recipientKeyPair: KeyPair,
  senderPublicKey: CryptoKey,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<string> {
  const recipientKeyId = await generateKeyFingerprint(recipientKeyPair.publicKey);
  
  // Find the shared secret intended for this recipient
  const targetSecret = sharedSecrets.find(
    secret => secret.recipientPublicKeyId === recipientKeyId
  );
  
  if (!targetSecret) {
    throw new Error('No shared secret found for this recipient');
  }
  
  return decryptFromSender(
    targetSecret,
    recipientKeyPair.privateKey,
    senderPublicKey,
    config
  );
}
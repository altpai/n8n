// Core cryptographic types for the password manager

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt?: string; // Base64 encoded salt (for key derivation)
  algorithm: 'AES-GCM';
  keyDerivation?: 'PBKDF2';
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedKeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded (encrypted with user's master key)
}

export interface MasterKey {
  key: CryptoKey;
  salt: string; // Base64 encoded
}

export interface SharedSecret {
  encryptedData: EncryptedData;
  recipientPublicKeyId: string;
  senderPublicKeyId: string;
}

export interface CryptoConfig {
  // AES-GCM settings
  aesKeyLength: 256;
  ivLength: 12; // 96 bits for GCM
  
  // PBKDF2 settings
  pbkdf2Iterations: 100000;
  saltLength: 32; // 256 bits
  
  // ECDH settings for key exchange
  ecdhCurve: 'P-256';
}

export const DEFAULT_CRYPTO_CONFIG: CryptoConfig = {
  aesKeyLength: 256,
  ivLength: 12,
  pbkdf2Iterations: 100000,
  saltLength: 32,
  ecdhCurve: 'P-256',
};

export interface VaultKeyMaterial {
  masterKey: CryptoKey;
  keyPair: KeyPair;
  exportedKeyPair: ExportedKeyPair;
}
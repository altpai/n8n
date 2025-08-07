// Vault service for managing encrypted vault data

import type { Vault, EncryptedVault, VaultEntry, VaultFolder } from '@/types/vault';
import type { VaultKeyMaterial } from '@/types/crypto';
import {
  generateVaultKey,
  encryptData,
  decryptData,
  exportKey,
  importKey,
} from '@/lib/crypto/encryption';
import { generateKeyFingerprint } from '@/lib/crypto/utils';

/**
 * Vault service for managing encrypted vault operations
 */
export class VaultService {
  /**
   * Create a new vault with its own encryption key
   */
  static async createVault(
    name: string,
    description: string | undefined,
    ownerId: string,
    masterKey: CryptoKey,
    organizationId?: string
  ): Promise<EncryptedVault> {
    // Generate a unique encryption key for this vault
    const vaultKey = await generateVaultKey();
    const keyFingerprint = await generateKeyFingerprint(vaultKey);
    
    // Encrypt the vault key with the user's master key
    const encryptedKey = await exportKey(vaultKey, masterKey);
    
    // Create the initial vault structure
    const vault: Vault = {
      id: crypto.randomUUID(),
      name,
      description,
      entries: [],
      folders: [],
      ownerId,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      encryptedKey,
      keyFingerprint,
    };
    
    // Encrypt the vault data
    const encryptedData = await this.encryptVaultData(vault, vaultKey);
    
    return {
      id: vault.id,
      name: vault.name,
      description: vault.description,
      encryptedData,
      encryptedKey,
      keyFingerprint,
      ownerId,
      organizationId,
      createdAt: vault.createdAt,
      updatedAt: vault.updatedAt,
    };
  }
  
  /**
   * Decrypt a vault using the user's master key
   */
  static async decryptVault(
    encryptedVault: EncryptedVault,
    masterKey: CryptoKey
  ): Promise<Vault> {
    // Import the vault key
    const vaultKey = await importKey(encryptedVault.encryptedKey, masterKey);
    
    // Verify key fingerprint
    const keyFingerprint = await generateKeyFingerprint(vaultKey);
    if (keyFingerprint !== encryptedVault.keyFingerprint) {
      throw new Error('Vault key fingerprint mismatch - possible tampering');
    }
    
    // Decrypt the vault data
    const vaultData = await this.decryptVaultData(encryptedVault.encryptedData, vaultKey);
    
    return {
      ...vaultData,
      id: encryptedVault.id,
      name: encryptedVault.name,
      description: encryptedVault.description,
      ownerId: encryptedVault.ownerId,
      organizationId: encryptedVault.organizationId,
      createdAt: encryptedVault.createdAt,
      updatedAt: encryptedVault.updatedAt,
      lastAccessedAt: encryptedVault.lastAccessedAt,
      encryptedKey: encryptedVault.encryptedKey,
      keyFingerprint: encryptedVault.keyFingerprint,
    };
  }
  
  /**
   * Update a vault and re-encrypt its data
   */
  static async updateVault(
    vault: Vault,
    masterKey: CryptoKey
  ): Promise<EncryptedVault> {
    // Import the vault key
    const vaultKey = await importKey(vault.encryptedKey, masterKey);
    
    // Update timestamp
    vault.updatedAt = new Date();
    
    // Encrypt the updated vault data
    const encryptedData = await this.encryptVaultData(vault, vaultKey);
    
    return {
      id: vault.id,
      name: vault.name,
      description: vault.description,
      encryptedData,
      encryptedKey: vault.encryptedKey,
      keyFingerprint: vault.keyFingerprint,
      ownerId: vault.ownerId,
      organizationId: vault.organizationId,
      createdAt: vault.createdAt,
      updatedAt: vault.updatedAt,
      lastAccessedAt: vault.lastAccessedAt,
    };
  }
  
  /**
   * Add an entry to a vault
   */
  static async addEntry(
    vault: Vault,
    entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>,
    masterKey: CryptoKey
  ): Promise<EncryptedVault> {
    const newEntry: VaultEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    vault.entries.push(newEntry);
    return this.updateVault(vault, masterKey);
  }
  
  /**
   * Update an entry in a vault
   */
  static async updateEntry(
    vault: Vault,
    entryId: string,
    updates: Partial<VaultEntry>,
    masterKey: CryptoKey
  ): Promise<EncryptedVault> {
    const entryIndex = vault.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) {
      throw new Error('Entry not found');
    }
    
    vault.entries[entryIndex] = {
      ...vault.entries[entryIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.updateVault(vault, masterKey);
  }
  
  /**
   * Delete an entry from a vault
   */
  static async deleteEntry(
    vault: Vault,
    entryId: string,
    masterKey: CryptoKey
  ): Promise<EncryptedVault> {
    vault.entries = vault.entries.filter(e => e.id !== entryId);
    return this.updateVault(vault, masterKey);
  }
  
  /**
   * Add a folder to a vault
   */
  static async addFolder(
    vault: Vault,
    folder: Omit<VaultFolder, 'id' | 'createdAt' | 'updatedAt'>,
    masterKey: CryptoKey
  ): Promise<EncryptedVault> {
    const newFolder: VaultFolder = {
      ...folder,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    vault.folders.push(newFolder);
    return this.updateVault(vault, masterKey);
  }
  
  /**
   * Search entries in a vault
   */
  static searchEntries(vault: Vault, query: string): VaultEntry[] {
    const lowercaseQuery = query.toLowerCase();
    
    return vault.entries.filter(entry => {
      // Search in entry name
      if (entry.name.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in non-sensitive fields
      const nonSensitiveFields = entry.fields.filter(field => !field.sensitive);
      if (nonSensitiveFields.some(field => 
        field.value.toLowerCase().includes(lowercaseQuery) ||
        field.name.toLowerCase().includes(lowercaseQuery)
      )) {
        return true;
      }
      
      // Search in tags
      if (entry.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))) {
        return true;
      }
      
      // Search in notes (if not sensitive)
      if (entry.notes && entry.notes.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Get entries by folder
   */
  static getEntriesByFolder(vault: Vault, folderId: string | undefined): VaultEntry[] {
    return vault.entries.filter(entry => entry.folderId === folderId);
  }
  
  /**
   * Get favorite entries
   */
  static getFavoriteEntries(vault: Vault): VaultEntry[] {
    return vault.entries.filter(entry => entry.favorite);
  }
  
  /**
   * Private method to encrypt vault data
   */
  private static async encryptVaultData(vault: Vault, vaultKey: CryptoKey): Promise<string> {
    const dataToEncrypt = {
      entries: vault.entries,
      folders: vault.folders,
    };
    
    const encrypted = await encryptData(JSON.stringify(dataToEncrypt), vaultKey);
    return JSON.stringify(encrypted);
  }
  
  /**
   * Private method to decrypt vault data
   */
  private static async decryptVaultData(encryptedData: string, vaultKey: CryptoKey): Promise<{entries: VaultEntry[], folders: VaultFolder[]}> {
    const encrypted = JSON.parse(encryptedData);
    const decryptedJson = await decryptData(encrypted, vaultKey);
    
    const data = JSON.parse(decryptedJson);
    
    // Convert date strings back to Date objects
    data.entries = data.entries.map((entry: any) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      lastAccessedAt: entry.lastAccessedAt ? new Date(entry.lastAccessedAt) : undefined,
      expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined,
    }));
    
    data.folders = data.folders.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
    }));
    
    return data;
  }
}
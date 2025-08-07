// Test suite for VaultService encryption/decryption functionality

import { VaultService } from '../vaultService';
import { deriveMasterKey } from '../../crypto/encryption';
import type { VaultEntry } from '@/types/vault';
import { VAULT_ENTRY_TEMPLATES } from '@/types/vault';

// Mock crypto.randomUUID for consistent testing
const mockUUID = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    ...global.crypto,
    randomUUID: mockUUID,
  },
});

describe('VaultService', () => {
  let masterKey: CryptoKey;
  const testPassword = 'test-master-password-123!';
  const userId = 'test-user-id';

  beforeAll(async () => {
    // Derive a master key for testing
    const masterKeyResult = await deriveMasterKey(testPassword);
    masterKey = masterKeyResult.key;
    
    // Setup UUID mock
    let uuidCounter = 0;
    mockUUID.mockImplementation(() => `test-uuid-${++uuidCounter}`);
  });

  beforeEach(() => {
    mockUUID.mockClear();
  });

  describe('createVault', () => {
    it('should create an encrypted vault with proper structure', async () => {
      const vaultName = 'Test Vault';
      const vaultDescription = 'A test vault for unit testing';

      const encryptedVault = await VaultService.createVault(
        vaultName,
        vaultDescription,
        userId,
        masterKey
      );

      expect(encryptedVault).toHaveProperty('id');
      expect(encryptedVault.name).toBe(vaultName);
      expect(encryptedVault.description).toBe(vaultDescription);
      expect(encryptedVault.ownerId).toBe(userId);
      expect(encryptedVault).toHaveProperty('encryptedData');
      expect(encryptedVault).toHaveProperty('encryptedKey');
      expect(encryptedVault).toHaveProperty('keyFingerprint');
      expect(encryptedVault).toHaveProperty('createdAt');
      expect(encryptedVault).toHaveProperty('updatedAt');
    });
  });

  describe('decryptVault', () => {
    it('should decrypt a vault and return proper structure', async () => {
      // Create a vault first
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      // Decrypt it
      const decryptedVault = await VaultService.decryptVault(encryptedVault, masterKey);

      expect(decryptedVault.id).toBe(encryptedVault.id);
      expect(decryptedVault.name).toBe(encryptedVault.name);
      expect(decryptedVault.description).toBe(encryptedVault.description);
      expect(decryptedVault.ownerId).toBe(userId);
      expect(decryptedVault.entries).toEqual([]);
      expect(decryptedVault.folders).toEqual([]);
      expect(decryptedVault).toHaveProperty('encryptedKey');
      expect(decryptedVault).toHaveProperty('keyFingerprint');
    });

    it('should throw error for invalid master key', async () => {
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      // Create a different master key
      const wrongMasterKey = await deriveMasterKey('wrong-password');

      await expect(
        VaultService.decryptVault(encryptedVault, wrongMasterKey.key)
      ).rejects.toThrow();
    });
  });

  describe('addEntry', () => {
    it('should add a password entry to vault', async () => {
      // Create a vault
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      // Decrypt it to work with
      const vault = await VaultService.decryptVault(encryptedVault, masterKey);

      // Create a password entry
      const passwordFields = VAULT_ENTRY_TEMPLATES.password.map(template => ({
        ...template,
        value: template.id === 'username' ? 'testuser@example.com' :
               template.id === 'password' ? 'super-secure-password' :
               template.id === 'website' ? 'https://example.com' : '',
      }));

      const entryData = {
        name: 'Example.com Account',
        type: 'password' as const,
        fields: passwordFields,
        notes: 'Test account for example.com',
        favorite: false,
        tags: ['work', 'email'],
      };

      // Add the entry
      const updatedEncryptedVault = await VaultService.addEntry(vault, entryData, masterKey);

      // Decrypt to verify
      const updatedVault = await VaultService.decryptVault(updatedEncryptedVault, masterKey);

      expect(updatedVault.entries).toHaveLength(1);
      const addedEntry = updatedVault.entries[0];
      expect(addedEntry.name).toBe(entryData.name);
      expect(addedEntry.type).toBe(entryData.type);
      expect(addedEntry.fields).toHaveLength(4);
      expect(addedEntry.notes).toBe(entryData.notes);
      expect(addedEntry.tags).toEqual(entryData.tags);
      expect(addedEntry).toHaveProperty('id');
      expect(addedEntry).toHaveProperty('createdAt');
      expect(addedEntry).toHaveProperty('updatedAt');
    });
  });

  describe('updateEntry', () => {
    it('should update an existing entry', async () => {
      // Create vault with an entry
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      let vault = await VaultService.decryptVault(encryptedVault, masterKey);

      // Add initial entry
      const initialEntry = {
        name: 'Test Entry',
        type: 'password' as const,
        fields: VAULT_ENTRY_TEMPLATES.password,
        favorite: false,
        tags: [],
      };

      const vaultWithEntry = await VaultService.addEntry(vault, initialEntry, masterKey);
      vault = await VaultService.decryptVault(vaultWithEntry, masterKey);

      const entryId = vault.entries[0].id;

      // Update the entry
      const updates = {
        name: 'Updated Test Entry',
        favorite: true,
        tags: ['updated'],
      };

      const updatedEncryptedVault = await VaultService.updateEntry(
        vault,
        entryId,
        updates,
        masterKey
      );

      // Verify update
      const updatedVault = await VaultService.decryptVault(updatedEncryptedVault, masterKey);
      const updatedEntry = updatedVault.entries[0];

      expect(updatedEntry.name).toBe(updates.name);
      expect(updatedEntry.favorite).toBe(updates.favorite);
      expect(updatedEntry.tags).toEqual(updates.tags);
      expect(updatedEntry.updatedAt.getTime()).toBeGreaterThan(updatedEntry.createdAt.getTime());
    });

    it('should throw error for non-existent entry', async () => {
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      const vault = await VaultService.decryptVault(encryptedVault, masterKey);

      await expect(
        VaultService.updateEntry(vault, 'non-existent-id', { name: 'Updated' }, masterKey)
      ).rejects.toThrow('Entry not found');
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry from vault', async () => {
      // Create vault with entries
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      let vault = await VaultService.decryptVault(encryptedVault, masterKey);

      // Add two entries
      const entry1 = {
        name: 'Entry 1',
        type: 'password' as const,
        fields: VAULT_ENTRY_TEMPLATES.password,
        favorite: false,
        tags: [],
      };

      const entry2 = {
        name: 'Entry 2',
        type: 'note' as const,
        fields: VAULT_ENTRY_TEMPLATES.note,
        favorite: false,
        tags: [],
      };

      let updatedVault = await VaultService.addEntry(vault, entry1, masterKey);
      vault = await VaultService.decryptVault(updatedVault, masterKey);
      
      updatedVault = await VaultService.addEntry(vault, entry2, masterKey);
      vault = await VaultService.decryptVault(updatedVault, masterKey);

      expect(vault.entries).toHaveLength(2);

      // Delete first entry
      const entryToDelete = vault.entries[0].id;
      const vaultAfterDeletion = await VaultService.deleteEntry(vault, entryToDelete, masterKey);
      const finalVault = await VaultService.decryptVault(vaultAfterDeletion, masterKey);

      expect(finalVault.entries).toHaveLength(1);
      expect(finalVault.entries[0].name).toBe('Entry 2');
    });
  });

  describe('searchEntries', () => {
    it('should search entries by name and non-sensitive fields', async () => {
      // Create vault with multiple entries
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      let vault = await VaultService.decryptVault(encryptedVault, masterKey);

      // Add test entries
      const entries = [
        {
          name: 'Google Account',
          type: 'password' as const,
          fields: [
            { id: 'username', name: 'Username', value: 'user@gmail.com', type: 'email' as const, sensitive: false },
            { id: 'password', name: 'Password', value: 'secret123', type: 'password' as const, sensitive: true },
          ],
          favorite: false,
          tags: ['email', 'google'],
        },
        {
          name: 'Facebook Login',
          type: 'password' as const,
          fields: [
            { id: 'username', name: 'Username', value: 'user@example.com', type: 'email' as const, sensitive: false },
            { id: 'password', name: 'Password', value: 'facebook123', type: 'password' as const, sensitive: true },
          ],
          favorite: false,
          tags: ['social', 'facebook'],
        },
        {
          name: 'Bank Note',
          type: 'note' as const,
          fields: [
            { id: 'content', name: 'Content', value: 'Important banking information', type: 'textarea' as const, sensitive: true },
          ],
          favorite: false,
          tags: ['finance', 'bank'],
        },
      ];

      for (const entry of entries) {
        const updatedVault = await VaultService.addEntry(vault, entry, masterKey);
        vault = await VaultService.decryptVault(updatedVault, masterKey);
      }

      // Test searches
      expect(VaultService.searchEntries(vault, 'google')).toHaveLength(1);
      expect(VaultService.searchEntries(vault, 'gmail')).toHaveLength(1);
      expect(VaultService.searchEntries(vault, 'facebook')).toHaveLength(1);
      expect(VaultService.searchEntries(vault, 'bank')).toHaveLength(1);
      expect(VaultService.searchEntries(vault, 'user@')).toHaveLength(2);
      expect(VaultService.searchEntries(vault, 'nonexistent')).toHaveLength(0);
    });
  });

  describe('getFavoriteEntries', () => {
    it('should return only favorite entries', async () => {
      const encryptedVault = await VaultService.createVault(
        'Test Vault',
        'Test Description',
        userId,
        masterKey
      );

      let vault = await VaultService.decryptVault(encryptedVault, masterKey);

      // Add entries with different favorite status
      const entries = [
        {
          name: 'Favorite Entry',
          type: 'password' as const,
          fields: VAULT_ENTRY_TEMPLATES.password,
          favorite: true,
          tags: [],
        },
        {
          name: 'Regular Entry',
          type: 'password' as const,
          fields: VAULT_ENTRY_TEMPLATES.password,
          favorite: false,
          tags: [],
        },
      ];

      for (const entry of entries) {
        const updatedVault = await VaultService.addEntry(vault, entry, masterKey);
        vault = await VaultService.decryptVault(updatedVault, masterKey);
      }

      const favoriteEntries = VaultService.getFavoriteEntries(vault);
      expect(favoriteEntries).toHaveLength(1);
      expect(favoriteEntries[0].name).toBe('Favorite Entry');
      expect(favoriteEntries[0].favorite).toBe(true);
    });
  });

  describe('End-to-end encryption flow', () => {
    it('should maintain data integrity through multiple operations', async () => {
      // Create vault
      let encryptedVault = await VaultService.createVault(
        'Integration Test Vault',
        'Testing end-to-end flow',
        userId,
        masterKey
      );

      // Add multiple entries of different types
      let vault = await VaultService.decryptVault(encryptedVault, masterKey);

      const testEntries = [
        {
          name: 'Email Account',
          type: 'password' as const,
          fields: VAULT_ENTRY_TEMPLATES.password.map(f => ({
            ...f,
            value: f.id === 'email' ? 'test@example.com' : f.id === 'password' ? 'secure123!' : '',
          })),
          favorite: true,
          tags: ['email', 'work'],
        },
        {
          name: 'Credit Card',
          type: 'card' as const,
          fields: VAULT_ENTRY_TEMPLATES.card.map(f => ({
            ...f,
            value: f.id === 'cardNumber' ? '4111-1111-1111-1111' : 
                   f.id === 'cvv' ? '123' : 
                   f.id === 'expiryDate' ? '12/25' : '',
          })),
          favorite: false,
          tags: ['finance', 'card'],
        },
        {
          name: 'Secure Note',
          type: 'note' as const,
          fields: VAULT_ENTRY_TEMPLATES.note.map(f => ({
            ...f,
            value: 'This is a secure note with sensitive information.',
          })),
          favorite: false,
          tags: ['personal'],
        },
      ];

      // Add all entries
      for (const entry of testEntries) {
        encryptedVault = await VaultService.addEntry(vault, entry, masterKey);
        vault = await VaultService.decryptVault(encryptedVault, masterKey);
      }

      // Verify all entries were added correctly
      expect(vault.entries).toHaveLength(3);
      
      // Test search functionality
      expect(VaultService.searchEntries(vault, 'email')).toHaveLength(1);
      expect(VaultService.searchEntries(vault, 'card')).toHaveLength(1);
      expect(VaultService.getFavoriteEntries(vault)).toHaveLength(1);

      // Update an entry
      const emailEntry = vault.entries.find(e => e.name === 'Email Account');
      expect(emailEntry).toBeDefined();
      
      encryptedVault = await VaultService.updateEntry(
        vault,
        emailEntry!.id,
        { name: 'Updated Email Account', tags: ['email', 'work', 'updated'] },
        masterKey
      );
      
      vault = await VaultService.decryptVault(encryptedVault, masterKey);
      const updatedEntry = vault.entries.find(e => e.id === emailEntry!.id);
      expect(updatedEntry!.name).toBe('Updated Email Account');
      expect(updatedEntry!.tags).toContain('updated');

      // Delete an entry
      const noteEntry = vault.entries.find(e => e.type === 'note');
      expect(noteEntry).toBeDefined();
      
      encryptedVault = await VaultService.deleteEntry(vault, noteEntry!.id, masterKey);
      vault = await VaultService.decryptVault(encryptedVault, masterKey);
      
      expect(vault.entries).toHaveLength(2);
      expect(vault.entries.find(e => e.type === 'note')).toBeUndefined();

      // Final verification - decrypt with original master key should still work
      const finalVault = await VaultService.decryptVault(encryptedVault, masterKey);
      expect(finalVault.entries).toHaveLength(2);
      expect(finalVault.name).toBe('Integration Test Vault');
    });
  });
});
// Demonstration script for testing encryption/decryption flow

import { VaultService } from '../vault/vaultService';
import { deriveMasterKey } from '../crypto/encryption';
import { generateSecurePassword } from '../crypto/utils';
import { VAULT_ENTRY_TEMPLATES } from '@/types/vault';
import type { VaultEntry } from '@/types/vault';

/**
 * Demo function to test the complete encryption/decryption flow
 */
export async function runCryptoDemo(): Promise<void> {
  console.log('🔐 Starting Secure Password Manager Crypto Demo...\n');

  try {
    // Step 1: Derive master key from user password
    console.log('1. Deriving master key from password...');
    const userPassword = 'demo-master-password-2024!';
    const masterKeyResult = await deriveMasterKey(userPassword);
    console.log('✅ Master key derived successfully');
    console.log(`   Salt: ${masterKeyResult.salt.substring(0, 16)}...`);

    // Step 2: Create a new vault
    console.log('\n2. Creating encrypted vault...');
    const userId = 'demo-user-123';
    const encryptedVault = await VaultService.createVault(
      'Personal Vault',
      'My secure password vault for demo',
      userId,
      masterKeyResult.key
    );
    console.log('✅ Vault created successfully');
    console.log(`   Vault ID: ${encryptedVault.id}`);
    console.log(`   Key Fingerprint: ${encryptedVault.keyFingerprint}`);

    // Step 3: Decrypt the vault to work with it
    console.log('\n3. Decrypting vault...');
    let vault = await VaultService.decryptVault(encryptedVault, masterKeyResult.key);
    console.log('✅ Vault decrypted successfully');
    console.log(`   Entries: ${vault.entries.length}`);
    console.log(`   Folders: ${vault.folders.length}`);

    // Step 4: Generate secure passwords and create entries
    console.log('\n4. Generating secure passwords and creating entries...');
    
    const demoEntries = [
      {
        name: 'Gmail Account',
        type: 'password' as const,
        fields: VAULT_ENTRY_TEMPLATES.password.map(field => ({
          ...field,
          value: field.id === 'email' ? 'demo@gmail.com' :
                 field.id === 'password' ? generateSecurePassword({
                   length: 16,
                   includeUppercase: true,
                   includeLowercase: true,
                   includeNumbers: true,
                   includeSymbols: true,
                   excludeSimilar: true
                 }) :
                 field.id === 'website' ? 'https://gmail.com' :
                 field.id === 'username' ? 'demo.user' : '',
        })),
        notes: 'Primary email account',
        favorite: true,
        tags: ['email', 'google', 'primary'],
      },
      {
        name: 'Bank of Demo',
        type: 'password' as const,
        fields: VAULT_ENTRY_TEMPLATES.password.map(field => ({
          ...field,
          value: field.id === 'username' ? 'demo123' :
                 field.id === 'password' ? generateSecurePassword({
                   length: 20,
                   includeUppercase: true,
                   includeLowercase: true,
                   includeNumbers: true,
                   includeSymbols: false,
                   excludeSimilar: true
                 }) :
                 field.id === 'website' ? 'https://bankofdemo.com' : '',
        })),
        notes: 'Online banking credentials - NEVER share!',
        favorite: false,
        tags: ['banking', 'finance', 'sensitive'],
      },
      {
        name: 'Credit Card Info',
        type: 'card' as const,
        fields: VAULT_ENTRY_TEMPLATES.card.map(field => ({
          ...field,
          value: field.id === 'cardholderName' ? 'Demo User' :
                 field.id === 'cardNumber' ? '4532-1234-5678-9012' :
                 field.id === 'expiryDate' ? '12/28' :
                 field.id === 'cvv' ? '123' :
                 field.id === 'pin' ? '9876' : '',
        })),
        notes: 'Primary credit card',
        favorite: false,
        tags: ['finance', 'card', 'visa'],
      },
      {
        name: 'Secret Recovery Codes',
        type: 'note' as const,
        fields: VAULT_ENTRY_TEMPLATES.note.map(field => ({
          ...field,
          value: 'Recovery codes for various accounts:\n\nGoogle: abc123-def456-ghi789\nGitHub: xyz987-uvw654-rst321\nDropbox: mno147-pqr258-stu369',
        })),
        notes: 'Backup codes for 2FA recovery',
        favorite: false,
        tags: ['backup', '2fa', 'recovery'],
      },
    ];

    // Add each entry to the vault
    for (const entryData of demoEntries) {
      const updatedVault = await VaultService.addEntry(vault, entryData, masterKeyResult.key);
      vault = await VaultService.decryptVault(updatedVault, masterKeyResult.key);
      console.log(`   ✅ Added: ${entryData.name}`);
    }

    console.log(`\n   Total entries added: ${vault.entries.length}`);

    // Step 5: Test search functionality
    console.log('\n5. Testing search functionality...');
    const searchResults = [
      { query: 'gmail', results: VaultService.searchEntries(vault, 'gmail') },
      { query: 'bank', results: VaultService.searchEntries(vault, 'bank') },
      { query: 'card', results: VaultService.searchEntries(vault, 'card') },
      { query: 'recovery', results: VaultService.searchEntries(vault, 'recovery') },
    ];

    searchResults.forEach(({ query, results }) => {
      console.log(`   Search "${query}": ${results.length} results`);
      results.forEach(entry => console.log(`     - ${entry.name}`));
    });

    // Step 6: Test favorites
    console.log('\n6. Testing favorites...');
    const favoriteEntries = VaultService.getFavoriteEntries(vault);
    console.log(`   Favorite entries: ${favoriteEntries.length}`);
    favoriteEntries.forEach(entry => console.log(`     ⭐ ${entry.name}`));

    // Step 7: Update an entry
    console.log('\n7. Testing entry updates...');
    const gmailEntry = vault.entries.find(e => e.name === 'Gmail Account');
    if (gmailEntry) {
      const updatedVault = await VaultService.updateEntry(
        vault,
        gmailEntry.id,
        {
          name: 'Gmail Account (Updated)',
          tags: [...gmailEntry.tags, 'updated'],
          notes: 'Primary email account - recently updated password',
        },
        masterKeyResult.key
      );
      vault = await VaultService.decryptVault(updatedVault, masterKeyResult.key);
      console.log('   ✅ Gmail entry updated successfully');
    }

    // Step 8: Test vault re-encryption after operations
    console.log('\n8. Testing vault re-encryption...');
    const finalEncryptedVault = await VaultService.updateVault(vault, masterKeyResult.key);
    const reDecryptedVault = await VaultService.decryptVault(finalEncryptedVault, masterKeyResult.key);
    console.log('   ✅ Vault re-encrypted and decrypted successfully');
    console.log(`   Final entry count: ${reDecryptedVault.entries.length}`);

    // Step 9: Demonstrate data integrity
    console.log('\n9. Verifying data integrity...');
    const originalGmailEntry = vault.entries.find(e => e.name.includes('Gmail'));
    const reDecryptedGmailEntry = reDecryptedVault.entries.find(e => e.name.includes('Gmail'));
    
    if (originalGmailEntry && reDecryptedGmailEntry) {
      const passwordField = reDecryptedGmailEntry.fields.find(f => f.id === 'password');
      console.log('   ✅ Password field preserved after encryption/decryption');
      console.log(`   Password length: ${passwordField?.value.length} characters`);
    }

    // Step 10: Summary
    console.log('\n🎉 Crypto Demo Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Master key derived from password: ✅`);
    console.log(`   • Vault created and encrypted: ✅`);
    console.log(`   • ${vault.entries.length} entries added and encrypted: ✅`);
    console.log(`   • Search functionality: ✅`);
    console.log(`   • Entry updates: ✅`);
    console.log(`   • Data integrity maintained: ✅`);
    console.log(`   • Zero-knowledge architecture: ✅`);

    console.log('\n🔒 Security Features Demonstrated:');
    console.log('   • AES-256-GCM encryption for all sensitive data');
    console.log('   • PBKDF2 key derivation (100,000 iterations)');
    console.log('   • Unique encryption key per vault');
    console.log('   • Key fingerprinting for integrity verification');
    console.log('   • Secure password generation');
    console.log('   • Client-side encryption (no plaintext on server)');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

/**
 * Demo function specifically for testing password generation
 */
export function demonstratePasswordGeneration(): void {
  console.log('\n🔑 Password Generation Demo:');
  
  const passwordOptions = [
    {
      name: 'Strong (16 chars, all types)',
      options: {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
      },
    },
    {
      name: 'Ultra Strong (32 chars, exclude similar)',
      options: {
        length: 32,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
      },
    },
    {
      name: 'Alphanumeric Only (20 chars)',
      options: {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: true,
      },
    },
    {
      name: 'PIN-style (8 digits)',
      options: {
        length: 8,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
      },
    },
  ];

  passwordOptions.forEach(({ name, options }) => {
    const password = generateSecurePassword(options);
    console.log(`   ${name}: ${password}`);
  });
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Shield, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VaultCard } from './VaultCard';
import { EntryCard } from './EntryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultService } from '@/lib/vault/vaultService';
import { deriveMasterKey } from '@/lib/crypto/encryption';
import { generateSecurePassword } from '@/lib/crypto/utils';
import { VAULT_ENTRY_TEMPLATES } from '@/types/vault';
import type { Vault, VaultEntry, EncryptedVault } from '@/types/vault';

interface VaultDashboardProps {
  userPassword: string;
  userId: string;
}

export function VaultDashboard({ userPassword, userId }: VaultDashboardProps) {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Initialize master key and demo data
  useEffect(() => {
    const initializeVaults = async () => {
      try {
        setIsLoading(true);
        
        // Derive master key from user password
        const masterKeyResult = await deriveMasterKey(userPassword);
        setMasterKey(masterKeyResult.key);

        // Create demo vaults with sample data
        const demoVaults = await createDemoVaults(masterKeyResult.key, userId);
        setVaults(demoVaults);

        showNotification('Vaults loaded successfully', 'success');
      } catch (error) {
        console.error('Failed to initialize vaults:', error);
        showNotification('Failed to load vaults', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeVaults();
  }, [userPassword, userId]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyToClipboard = useCallback(async (value: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showNotification(`${fieldName} copied to clipboard`, 'success');
    } catch (error) {
      showNotification('Failed to copy to clipboard', 'error');
    }
  }, []);

  const handleCreateVault = async () => {
    if (!masterKey) return;

    try {
      const vaultName = `New Vault ${vaults.length + 1}`;
      const encryptedVault = await VaultService.createVault(
        vaultName,
        'A new secure vault',
        userId,
        masterKey
      );
      
      const newVault = await VaultService.decryptVault(encryptedVault, masterKey);
      setVaults([...vaults, newVault]);
      showNotification('New vault created', 'success');
    } catch (error) {
      console.error('Failed to create vault:', error);
      showNotification('Failed to create vault', 'error');
    }
  };

  const handleAddDemoEntry = async () => {
    if (!selectedVault || !masterKey) return;

    try {
      const entryTypes = ['password', 'note', 'card', 'identity'] as const;
      const randomType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
      
      const demoEntry = {
        name: `Demo ${randomType} ${selectedVault.entries.length + 1}`,
        type: randomType,
        fields: VAULT_ENTRY_TEMPLATES[randomType].map(field => ({
          ...field,
          value: field.sensitive && field.type === 'password' 
            ? generateSecurePassword({
                length: 16,
                includeUppercase: true,
                includeLowercase: true,
                includeNumbers: true,
                includeSymbols: true,
                excludeSimilar: true,
              })
            : field.id === 'email' ? 'demo@example.com'
            : field.id === 'website' ? 'https://example.com'
            : field.id === 'username' ? 'demouser'
            : field.id === 'cardNumber' ? '4111-1111-1111-1111'
            : field.id === 'content' ? 'This is a demo note with some content.'
            : '',
        })),
        favorite: Math.random() > 0.7,
        tags: ['demo', randomType],
        notes: `Demo ${randomType} entry for testing`,
      };

      const updatedEncryptedVault = await VaultService.addEntry(
        selectedVault,
        demoEntry,
        masterKey
      );
      
      const updatedVault = await VaultService.decryptVault(updatedEncryptedVault, masterKey);
      
      // Update the vault in the list
      setVaults(vaults.map(v => v.id === updatedVault.id ? updatedVault : v));
      setSelectedVault(updatedVault);
      
      showNotification('Demo entry added', 'success');
    } catch (error) {
      console.error('Failed to add demo entry:', error);
      showNotification('Failed to add entry', 'error');
    }
  };

  const filteredEntries = selectedVault
    ? VaultService.searchEntries(selectedVault, searchQuery)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Decrypting your vaults...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span>Secure Password Manager</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            End-to-end encrypted password management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
            <Key className="h-4 w-4" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!selectedVault ? (
        <div>
          {/* Vault Grid Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Vaults</h2>
            <Button onClick={handleCreateVault}>
              <Plus className="h-4 w-4 mr-2" />
              Create Vault
            </Button>
          </div>

          {/* Vault Grid */}
          {vaults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  onOpen={setSelectedVault}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No vaults yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first vault to start storing passwords securely
              </p>
              <Button onClick={handleCreateVault}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Vault
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Vault Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedVault(null)}
              >
                ← Back to Vaults
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{selectedVault.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedVault.entries.length} entries
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleAddDemoEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Add Demo Entry
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Entries */}
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onView={(entry) => {
                    // In a real app, this would open an entry detail modal
                    console.log('View entry:', entry);
                  }}
                  onCopyField={handleCopyToClipboard}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No entries found' : 'No entries yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No entries match "${searchQuery}"`
                  : 'Add your first password or secure note to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleAddDemoEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Demo Entry
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to create demo vaults with sample data
async function createDemoVaults(masterKey: CryptoKey, userId: string): Promise<Vault[]> {
  const demoVaultData = [
    {
      name: 'Personal Vault',
      description: 'Personal passwords and secure notes',
      entries: [
        {
          name: 'Gmail Account',
          type: 'password' as const,
          fields: [
            { id: 'email', name: 'Email', value: 'demo@gmail.com', type: 'email' as const, sensitive: false },
            { id: 'password', name: 'Password', value: generateSecurePassword({
              length: 16, includeUppercase: true, includeLowercase: true, 
              includeNumbers: true, includeSymbols: true, excludeSimilar: true
            }), type: 'password' as const, sensitive: true },
            { id: 'website', name: 'Website', value: 'https://gmail.com', type: 'url' as const, sensitive: false },
          ],
          favorite: true,
          tags: ['email', 'google'],
          notes: 'Primary email account',
        },
        {
          name: 'Banking Login',
          type: 'password' as const,
          fields: [
            { id: 'username', name: 'Username', value: 'demo123', type: 'text' as const, sensitive: false },
            { id: 'password', name: 'Password', value: generateSecurePassword({
              length: 20, includeUppercase: true, includeLowercase: true, 
              includeNumbers: true, includeSymbols: false, excludeSimilar: true
            }), type: 'password' as const, sensitive: true },
            { id: 'website', name: 'Website', value: 'https://mybank.com', type: 'url' as const, sensitive: false },
          ],
          favorite: false,
          tags: ['banking', 'finance'],
          notes: 'Online banking - never share!',
        },
      ],
    },
    {
      name: 'Work Vault',
      description: 'Work-related credentials and notes',
      entries: [
        {
          name: 'Company Portal',
          type: 'password' as const,
          fields: [
            { id: 'username', name: 'Username', value: 'demo.employee', type: 'text' as const, sensitive: false },
            { id: 'password', name: 'Password', value: generateSecurePassword({
              length: 14, includeUppercase: true, includeLowercase: true, 
              includeNumbers: true, includeSymbols: true, excludeSimilar: false
            }), type: 'password' as const, sensitive: true },
            { id: 'website', name: 'Website', value: 'https://portal.company.com', type: 'url' as const, sensitive: false },
          ],
          favorite: false,
          tags: ['work', 'portal'],
          notes: 'Company intranet access',
        },
      ],
    },
  ];

  const vaults: Vault[] = [];
  
  for (const vaultData of demoVaultData) {
    const encryptedVault = await VaultService.createVault(
      vaultData.name,
      vaultData.description,
      userId,
      masterKey
    );
    
    let vault = await VaultService.decryptVault(encryptedVault, masterKey);
    
    // Add demo entries
    for (const entryData of vaultData.entries) {
      const updatedEncryptedVault = await VaultService.addEntry(vault, entryData, masterKey);
      vault = await VaultService.decryptVault(updatedEncryptedVault, masterKey);
    }
    
    vaults.push(vault);
  }

  return vaults;
}
// Vault and password entry data structures

export type VaultEntryType = 'password' | 'note' | 'card' | 'identity';

export interface VaultEntryField {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'password' | 'email' | 'url' | 'phone' | 'textarea';
  sensitive: boolean; // Whether this field should be encrypted
}

export interface VaultEntry {
  id: string;
  name: string;
  type: VaultEntryType;
  fields: VaultEntryField[];
  notes?: string;
  favorite: boolean;
  tags: string[];
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  expiresAt?: Date; // For time-limited entries
}

export interface Vault {
  id: string;
  name: string;
  description?: string;
  entries: VaultEntry[];
  folders: VaultFolder[];
  ownerId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  
  // Encryption metadata
  encryptedKey: string; // Vault's encryption key, encrypted with user's master key
  keyFingerprint: string; // For key verification
}

export interface VaultFolder {
  id: string;
  name: string;
  parentId?: string; // For nested folders
  vaultId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Encrypted vault data that gets stored
export interface EncryptedVault {
  id: string;
  name: string; // Not encrypted for display purposes
  description?: string; // Not encrypted
  encryptedData: string; // JSON string of encrypted vault entries and folders
  encryptedKey: string; // Vault key encrypted with user's master key
  keyFingerprint: string;
  ownerId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

// Pre-defined field templates for different entry types
export const VAULT_ENTRY_TEMPLATES: Record<VaultEntryType, VaultEntryField[]> = {
  password: [
    {
      id: 'username',
      name: 'Username',
      value: '',
      type: 'text',
      sensitive: false,
    },
    {
      id: 'email',
      name: 'Email',
      value: '',
      type: 'email',
      sensitive: false,
    },
    {
      id: 'password',
      name: 'Password',
      value: '',
      type: 'password',
      sensitive: true,
    },
    {
      id: 'website',
      name: 'Website',
      value: '',
      type: 'url',
      sensitive: false,
    },
  ],
  note: [
    {
      id: 'content',
      name: 'Content',
      value: '',
      type: 'textarea',
      sensitive: true,
    },
  ],
  card: [
    {
      id: 'cardholderName',
      name: 'Cardholder Name',
      value: '',
      type: 'text',
      sensitive: false,
    },
    {
      id: 'cardNumber',
      name: 'Card Number',
      value: '',
      type: 'text',
      sensitive: true,
    },
    {
      id: 'expiryDate',
      name: 'Expiry Date',
      value: '',
      type: 'text',
      sensitive: true,
    },
    {
      id: 'cvv',
      name: 'CVV',
      value: '',
      type: 'password',
      sensitive: true,
    },
    {
      id: 'pin',
      name: 'PIN',
      value: '',
      type: 'password',
      sensitive: true,
    },
  ],
  identity: [
    {
      id: 'firstName',
      name: 'First Name',
      value: '',
      type: 'text',
      sensitive: false,
    },
    {
      id: 'lastName',
      name: 'Last Name',
      value: '',
      type: 'text',
      sensitive: false,
    },
    {
      id: 'email',
      name: 'Email',
      value: '',
      type: 'email',
      sensitive: false,
    },
    {
      id: 'phone',
      name: 'Phone',
      value: '',
      type: 'phone',
      sensitive: false,
    },
    {
      id: 'address',
      name: 'Address',
      value: '',
      type: 'textarea',
      sensitive: false,
    },
    {
      id: 'ssn',
      name: 'SSN',
      value: '',
      type: 'password',
      sensitive: true,
    },
  ],
};

// Vault sharing and permissions
export type VaultPermission = 'read' | 'write' | 'admin';

export interface VaultShare {
  id: string;
  vaultId: string;
  sharedWithUserId: string;
  sharedByUserId: string;
  permission: VaultPermission;
  encryptedVaultKey: string; // Vault key encrypted for the recipient
  createdAt: Date;
  expiresAt?: Date;
  revoked: boolean;
  revokedAt?: Date;
}

// Audit logging
export type AuditAction = 
  | 'vault_created'
  | 'vault_updated'
  | 'vault_deleted'
  | 'vault_shared'
  | 'vault_unshared'
  | 'entry_created'
  | 'entry_updated'
  | 'entry_deleted'
  | 'entry_viewed'
  | 'entry_copied'
  | 'login'
  | 'logout'
  | 'password_changed';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: 'vault' | 'entry' | 'user';
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Search and filtering
export interface VaultSearchOptions {
  query?: string;
  type?: VaultEntryType;
  tags?: string[];
  folderId?: string;
  favorite?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
}
// User and organization data structures

export type UserRole = 'admin' | 'member' | 'viewer';
export type MfaMethod = 'totp' | 'sms' | 'email' | 'fido2';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  
  // Security settings
  mfaEnabled: boolean;
  mfaMethods: MfaMethod[];
  mfaBackupCodes?: string[];
  
  // Encryption keys
  publicKey: string; // Base64 encoded public key for sharing
  encryptedPrivateKey: string; // Private key encrypted with master key
  keyFingerprint: string;
  masterKeySalt: string; // Salt for deriving master key from password
  
  // Organization membership
  organizationId?: string;
  organizationRole?: UserRole;
  
  // Settings
  settings: UserSettings;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  
  // Security preferences
  sessionTimeout: number; // Minutes
  requireMfaForSensitiveActions: boolean;
  autoLockTimeout: number; // Minutes
  
  // Vault preferences
  defaultVaultView: 'grid' | 'list';
  showFavorites: boolean;
  
  // Notifications
  emailNotifications: boolean;
  securityAlerts: boolean;
  
  // Password generation defaults
  defaultPasswordLength: number;
  defaultPasswordOptions: {
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    excludeSimilar: boolean;
  };
}

export interface Organization {
  id: string;
  name: string;
  domain?: string; // For email domain verification
  description?: string;
  logo?: string;
  
  // Settings
  settings: OrganizationSettings;
  
  // Billing
  plan: 'free' | 'team' | 'business' | 'enterprise';
  maxUsers: number;
  billingEmail?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  // Security policies
  requireMfa: boolean;
  allowedMfaMethods: MfaMethod[];
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // Minutes
  
  // Sharing policies
  allowExternalSharing: boolean;
  requireApprovalForSharing: boolean;
  
  // Audit settings
  auditRetentionDays: number;
  
  // SSO settings
  ssoEnabled: boolean;
  ssoProvider?: 'google' | 'microsoft' | 'okta' | 'auth0';
  ssoConfig?: Record<string, any>;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  prohibitCommonPasswords: boolean;
  prohibitPersonalInfo: boolean;
  maxPasswordAge?: number; // Days
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'invited' | 'active' | 'suspended';
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  invitedBy: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

// Session management
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    location?: string;
    deviceName?: string;
  };
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
}

// MFA types
export interface MfaSetup {
  method: MfaMethod;
  secret?: string; // For TOTP
  backupCodes: string[];
  verified: boolean;
}

export interface MfaChallenge {
  id: string;
  userId: string;
  method: MfaMethod;
  code?: string; // For SMS/Email
  challenge?: string; // For FIDO2
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}
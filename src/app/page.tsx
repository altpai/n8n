import React from 'react';
import { VaultDashboard } from '@/components/vault/VaultDashboard';

export default function HomePage() {
  // In a real application, these would come from authentication
  const demoUserPassword = 'secure-demo-password-2024!';
  const demoUserId = 'demo-user-123';

  return (
    <main className="min-h-screen bg-background">
      <VaultDashboard 
        userPassword={demoUserPassword}
        userId={demoUserId}
      />
    </main>
  );
}
import React from 'react';
import { format } from 'date-fns';
import { Lock, Users, Clock, Star } from 'lucide-react';
import type { Vault } from '@/types/vault';
import { Button } from '@/components/ui/button';

interface VaultCardProps {
  vault: Vault;
  onOpen: (vault: Vault) => void;
  onEdit?: (vault: Vault) => void;
  onShare?: (vault: Vault) => void;
}

export function VaultCard({ vault, onOpen, onEdit, onShare }: VaultCardProps) {
  const entryCount = vault.entries.length;
  const favoriteCount = vault.entries.filter(e => e.favorite).length;
  const lastAccessed = vault.lastAccessedAt || vault.updatedAt;

  return (
    <div className="vault-card group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{vault.name}</h3>
        </div>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShare(vault);
              }}
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vault);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {vault.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {vault.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <div className="flex items-center space-x-4">
          <span>{entryCount} entries</span>
          {favoriteCount > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-current" />
              <span>{favoriteCount}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{format(lastAccessed, 'MMM d')}</span>
        </div>
      </div>

      <Button 
        className="w-full" 
        onClick={() => onOpen(vault)}
      >
        Open Vault
      </Button>
    </div>
  );
}
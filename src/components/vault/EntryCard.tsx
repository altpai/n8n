'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Key, 
  StickyNote, 
  CreditCard, 
  User, 
  Star, 
  Copy, 
  Eye, 
  EyeOff,
  MoreHorizontal,
  Globe
} from 'lucide-react';
import type { VaultEntry, VaultEntryType } from '@/types/vault';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EntryCardProps {
  entry: VaultEntry;
  onView: (entry: VaultEntry) => void;
  onEdit?: (entry: VaultEntry) => void;
  onDelete?: (entry: VaultEntry) => void;
  onCopyField?: (fieldValue: string, fieldName: string) => void;
}

const ENTRY_ICONS: Record<VaultEntryType, React.ComponentType<{ className?: string }>> = {
  password: Key,
  note: StickyNote,
  card: CreditCard,
  identity: User,
};

const ENTRY_COLORS: Record<VaultEntryType, string> = {
  password: 'text-blue-600 dark:text-blue-400',
  note: 'text-green-600 dark:text-green-400',
  card: 'text-purple-600 dark:text-purple-400',
  identity: 'text-orange-600 dark:text-orange-400',
};

export function EntryCard({ entry, onView, onEdit, onDelete, onCopyField }: EntryCardProps) {
  const [showSensitive, setShowSensitive] = useState(false);
  const Icon = ENTRY_ICONS[entry.type];
  const iconColor = ENTRY_COLORS[entry.type];

  // Get the primary field to display (usually username/email for passwords)
  const primaryField = entry.fields.find(f => 
    f.id === 'username' || f.id === 'email' || f.id === 'cardholderName'
  );

  // Get a password or sensitive field to show/hide
  const sensitiveField = entry.fields.find(f => f.sensitive);

  // Get website URL if available
  const websiteField = entry.fields.find(f => f.id === 'website' && f.value);

  const handleCopyField = (field: { value: string; name: string }) => {
    if (onCopyField) {
      onCopyField(field.value, field.name);
    }
  };

  return (
    <div className="entry-card group" onClick={() => onView(entry)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Icon className={cn('h-4 w-4 flex-shrink-0', iconColor)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium truncate">{entry.name}</h4>
              {entry.favorite && (
                <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>
            {primaryField && (
              <p className="text-sm text-muted-foreground truncate">
                {primaryField.value}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {websiteField && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(websiteField.value, '_blank', 'noopener,noreferrer');
              }}
              title="Open website"
            >
              <Globe className="h-3 w-3" />
            </Button>
          )}

          {sensitiveField && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyField(sensitiveField);
              }}
              title={`Copy ${sensitiveField.name}`}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Show more options menu
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Show sensitive field if available */}
      {sensitiveField && (
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-muted-foreground min-w-0 flex-shrink-0">
            {sensitiveField.name}:
          </span>
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            <span className={cn(
              'text-sm font-mono truncate',
              showSensitive ? '' : 'select-none'
            )}>
              {showSensitive ? sensitiveField.value : '••••••••••••'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowSensitive(!showSensitive);
              }}
              className="flex-shrink-0"
            >
              {showSensitive ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {entry.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{entry.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer with last updated */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Updated {format(entry.updatedAt, 'MMM d, yyyy')}</span>
        {entry.expiresAt && (
          <span className="text-orange-600 dark:text-orange-400">
            Expires {format(entry.expiresAt, 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}
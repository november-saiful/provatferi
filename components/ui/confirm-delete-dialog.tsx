'use client';

import * as React from 'react';
import { Dialog } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  name: string;
  nameLabel?: string;
  description?: string;
  confirmLabel?: string;
  isDeleting?: boolean;
}

/**
 * Confirmation dialog that requires typing the record's name before the
 * destructive action can be triggered (per the planning doc's
 * "Type event name to confirm" requirement).
 */
export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  name,
  nameLabel = 'রেকর্ডের নাম',
  description,
  confirmLabel = 'মুছুন',
  isDeleting = false
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = React.useState('');

  React.useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const matches = typed.trim() === name;

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (matches) onConfirm();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            নিশ্চিত করতে <span className="font-semibold">“{name}”</span> টাইপ করুন
          </Label>
          <Input
            id="confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={name}
            autoFocus
          />
          {typed.trim().length > 0 && !matches && (
            <p className="text-xs text-warmred-500">নাম মেলেনি।</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" variant="destructive" disabled={!matches || isDeleting}>
            {isDeleting ? 'মুছে ফেলা হচ্ছে…' : confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { pendingCount, subscribe } from '../../lib/sync';
import { logoutPromptCopy } from '../../lib/logout-ux';
import { ConfirmDialog } from './ConfirmDialog';

interface LogoutDialogProps {
  open: boolean;
  onCancel: () => void;
  onLoggedOut: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onCancel, onLoggedOut }) => {
  const { userId, householdId, logout, logoutError } = useAuthStore();
  const scope = useMemo(() => ({ userId, householdId }), [userId, householdId]);
  // Read the count during render so a newly opened dialog cannot briefly show
  // the non-destructive copy before the subscription effect runs.
  const [ownedPendingCount, setOwnedPendingCount] = useState(() => pendingCount(scope));
  const visiblePendingCount = open ? pendingCount(scope) : ownedPendingCount;

  useEffect(() => {
    if (!open) return;
    const refresh = () => setOwnedPendingCount(pendingCount(scope));
    refresh();
    return subscribe(refresh);
  }, [open, scope]);

  if (!open) return null;

  const copy = logoutPromptCopy(visiblePendingCount);
  const description = [copy.description, logoutError].filter(Boolean).join(' ');

  const discardAndLogout = () => {
    const latest = pendingCount(scope);
    if (latest !== visiblePendingCount) {
      setOwnedPendingCount(latest);
      return;
    }
    void logout().then((success) => {
      if (success) onLoggedOut();
    });
  };

  return (
    <ConfirmDialog
      open
      title="Đăng xuất tài khoản?"
      description={description}
      confirmText={copy.confirmText}
      cancelText={copy.cancelText}
      destructive
      onConfirm={discardAndLogout}
      onCancel={onCancel}
    />
  );
};

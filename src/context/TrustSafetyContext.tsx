import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  openSwapDispute,
  setUserBlock,
  submitReport,
  subscribeToUserBlocks,
} from '@/features/trust-safety/trust-safety-service';
import type {
  DisputeReason,
  ReportReason,
  ReportTargetType,
} from '@/features/trust-safety/types';

interface TrustSafetyContextType {
  blockedUserIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  isCloudBacked: boolean;
  isBlocked: (userId: string) => boolean;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  report: (input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
  }) => Promise<string>;
  openDispute: (input: {
    transactionId: string;
    reason: DisputeReason;
    details?: string;
  }) => Promise<string>;
}

interface TrustSafetySnapshot {
  ownerId: string;
  blockedIds: string[];
  error: string | null;
}

const TrustSafetyContext = createContext<TrustSafetyContextType | undefined>(
  undefined,
);

export function TrustSafetyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const [snapshot, setSnapshot] = useState<TrustSafetySnapshot | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );
  const activeOwnerId = user?.id ?? null;
  const currentSnapshot =
    activeOwnerId && snapshot?.ownerId === activeOwnerId ? snapshot : null;
  const isLoading = Boolean(activeOwnerId && isCloudBacked && !currentSnapshot);
  const error = currentSnapshot?.error ?? null;

  useEffect(() => {
    if (!user || !isCloudBacked) {
      return undefined;
    }

    const ownerId = user.id;
    return subscribeToUserBlocks(
      ownerId,
      (blocks) => {
        setSnapshot({
          ownerId,
          blockedIds: blocks.map((block) => block.blockedId),
          error: null,
        });
      },
      (subscriptionError) => {
        console.error('Trust & Safety blocks subscription failed', subscriptionError);
        setSnapshot({
          ownerId,
          blockedIds: [],
          error: 'Blockierte Konten konnten nicht geladen werden.',
        });
      },
    );
  }, [isCloudBacked, user]);

  const blockedUserIds = useMemo(
    () => new Set(currentSnapshot?.blockedIds ?? []),
    [currentSnapshot],
  );

  const requireCloud = () => {
    if (!user || !isCloudBacked) {
      throw new Error('TRUST_CLOUD_BACKEND_REQUIRED');
    }
  };

  const blockUser = async (userId: string): Promise<void> => {
    requireCloud();
    await setUserBlock({ targetUserId: userId, action: 'block' });
  };

  const unblockUser = async (userId: string): Promise<void> => {
    requireCloud();
    await setUserBlock({ targetUserId: userId, action: 'unblock' });
  };

  const report = async (input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
  }): Promise<string> => {
    requireCloud();
    const response = await submitReport({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details?.trim() ?? '',
    });
    return response.reportId;
  };

  const openDispute = async (input: {
    transactionId: string;
    reason: DisputeReason;
    details?: string;
  }): Promise<string> => {
    requireCloud();
    const response = await openSwapDispute({
      transactionId: input.transactionId,
      reason: input.reason,
      details: input.details?.trim() ?? '',
    });
    return response.disputeId;
  };

  return (
    <TrustSafetyContext.Provider
      value={{
        blockedUserIds,
        isLoading,
        error,
        isCloudBacked,
        isBlocked: (userId) => blockedUserIds.has(userId),
        blockUser,
        unblockUser,
        report,
        openDispute,
      }}
    >
      {children}
    </TrustSafetyContext.Provider>
  );
}

export function useTrustSafety(): TrustSafetyContextType {
  const context = useContext(TrustSafetyContext);
  if (!context) {
    throw new Error('useTrustSafety must be used inside TrustSafetyProvider.');
  }
  return context;
}

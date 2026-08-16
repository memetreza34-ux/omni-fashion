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

const TrustSafetyContext = createContext<TrustSafetyContextType | undefined>(
  undefined,
);

export function TrustSafetyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  useEffect(() => {
    setError(null);
    setBlockedIds([]);
    setIsLoading(true);

    if (!user || !isCloudBacked) {
      setIsLoading(false);
      return undefined;
    }

    return subscribeToUserBlocks(
      user.id,
      (blocks) => {
        setBlockedIds(blocks.map((block) => block.blockedId));
        setIsLoading(false);
      },
      (subscriptionError) => {
        console.error('Trust & Safety blocks subscription failed', subscriptionError);
        setError('Blockierte Konten konnten nicht geladen werden.');
        setIsLoading(false);
      },
    );
  }, [isCloudBacked, user]);

  const blockedUserIds = useMemo(() => new Set(blockedIds), [blockedIds]);

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

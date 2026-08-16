export const TRUST_SAFETY_SCHEMA_VERSION = 1 as const;

export const REPORT_REASONS = [
  'spam',
  'fraud',
  'counterfeit',
  'prohibited_item',
  'harassment',
  'unsafe_meetup',
  'other',
] as const;

export const DISPUTE_REASONS = [
  'item_not_received',
  'item_not_as_described',
  'wrong_item',
  'damaged_item',
  'unsafe_interaction',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type DisputeReason = (typeof DISPUTE_REASONS)[number];
export type ReportTargetType = 'listing' | 'user' | 'transaction';

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
  schemaVersion: typeof TRUST_SAFETY_SCHEMA_VERSION;
}

export interface SetUserBlockInput {
  targetUserId: string;
  action: 'block' | 'unblock';
}

export interface SetUserBlockResponse {
  targetUserId: string;
  blocked: boolean;
}

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string;
}

export interface SubmitReportResponse {
  reportId: string;
  status: 'open';
}

export interface OpenSwapDisputeInput {
  transactionId: string;
  reason: DisputeReason;
  details: string;
}

export interface OpenSwapDisputeResponse {
  transactionId: string;
  disputeId: string;
  status: 'disputed';
}

/**
 * SQLite (used for local dev, see prisma/schema.prisma) has no native enum
 * support in Prisma, so every field that would naturally be an enum is a
 * plain String column instead. These constants are the actual source of
 * truth for allowed values — enforced here via class-validator, not by the
 * database. If this ever moves to Postgres, converting these back to real
 * Prisma `enum` types is a clean upgrade, not a rewrite.
 */

export const KYC_TIERS = ["TIER_0", "TIER_1", "TIER_2"] as const;
export type KycTier = (typeof KYC_TIERS)[number];

export const CURRENCIES = ["USD", "LBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const TRANSACTION_TYPES = [
  "SEND",
  "BILL_PAY",
  "RECHARGE",
  "QR_PAYMENT",
  "CURRENCY_EXCHANGE",
  "TOP_UP",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
  "FLAGGED_FOR_REVIEW",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const KYC_CASE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type KycCaseStatus = (typeof KYC_CASE_STATUSES)[number];

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const MESSAGE_SENDERS = ["USER", "AGENT"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];

export const ADMIN_ROLES = ["SUPPORT_AGENT", "COMPLIANCE_OFFICER", "SUPER_ADMIN"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "FROZEN", "CLOSED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

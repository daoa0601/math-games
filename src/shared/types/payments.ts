/**
 * Payment Types
 *
 * Type definitions for the future payments feature.
 * These are placeholder types that will be expanded when the feature is implemented.
 * Designed for Vietnam market with support for local payment methods.
 */

export type PaymentProvider = 'momo' | 'zalopay' | 'vnpay' | 'bank_transfer' | 'stripe';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type ProductType = 'lesson' | 'course' | 'subscription';

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  price: number; // in VND
  currency: 'VND' | 'USD';
  // For lessons/courses: what content does this unlock?
  unlockLessonIds?: string[];
  unlockCourseIds?: string[];
  // For subscriptions: duration
  subscriptionDays?: number;
}

export interface Purchase {
  id: string;
  playerId: string;
  productId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: 'VND' | 'USD';
  createdAt: string;
  completedAt: string | null;
  // Provider-specific transaction ID
  transactionId: string | null;
}

export interface Subscription {
  id: string;
  playerId: string;
  productId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  cancelledAt: string | null;
  autoRenew: boolean;
}

export interface PaymentIntent {
  id: string;
  productId: string;
  amount: number;
  currency: 'VND' | 'USD';
  provider: PaymentProvider;
  // Provider-specific payment URL or data
  paymentUrl?: string;
  paymentData?: Record<string, unknown>;
  expiresAt: string;
}

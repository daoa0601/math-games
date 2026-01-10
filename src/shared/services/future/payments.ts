/**
 * Payments Service (Stub)
 *
 * Placeholder service for the future payments feature.
 * These functions will throw errors until the feature is implemented.
 *
 * Planned implementation:
 * - Integration with Vietnamese payment providers (MoMo, ZaloPay, VNPay)
 * - Stripe as fallback for international payments
 * - Purchase records in Firestore
 * - Cloud Functions for payment webhooks
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  Product,
  Purchase,
  Subscription,
  PaymentIntent,
  PaymentProvider,
} from '../../types/payments';

const NOT_IMPLEMENTED = 'Payments feature not yet implemented';

/**
 * Fetch all available products.
 */
export async function fetchProducts(): Promise<Product[]> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Fetch a specific product.
 */
export async function fetchProduct(_productId: string): Promise<Product> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Create a payment intent for a product.
 * Returns provider-specific payment URL or data.
 */
export async function createPaymentIntent(
  _productId: string,
  _provider: PaymentProvider
): Promise<PaymentIntent> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Verify a completed payment.
 * Called after user returns from payment provider.
 */
export async function verifyPayment(_paymentIntentId: string): Promise<Purchase> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Get user's purchase history.
 */
export async function getPurchaseHistory(): Promise<Purchase[]> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Check if user has purchased a specific product.
 */
export async function hasPurchased(_productId: string): Promise<boolean> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Get user's active subscription.
 */
export async function getActiveSubscription(): Promise<Subscription | null> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(_subscriptionId: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Check if user has an active subscription.
 */
export async function hasActiveSubscription(): Promise<boolean> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Restore purchases (e.g., after reinstall or new device).
 */
export async function restorePurchases(): Promise<Purchase[]> {
  throw new Error(NOT_IMPLEMENTED);
}

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

const supabase = getSupabaseClient();

export const PREMIUM_CONFIG = {
  priceId: 'price_1TIeO1D9H7oC4sguaaDG6luC',
  productId: 'prod_UHCnxFF6rAodT9',
  name: 'Premium',
  price: '$4.99',
  period: 'month',
};

export interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
}

export async function checkSubscription(): Promise<{ data: SubscriptionStatus | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('check-subscription');
  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const textContent = await error.context?.text();
        errorMessage = textContent || error.message;
      } catch {
        errorMessage = error.message;
      }
    }
    return { data: null, error: errorMessage };
  }
  return {
    data: {
      subscribed: data?.subscribed ?? false,
      productId: data?.product_id ?? null,
      subscriptionEnd: data?.subscription_end ?? null,
    },
    error: null,
  };
}

export async function createCheckoutSession(): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('create-checkout');
  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const textContent = await error.context?.text();
        const parsed = JSON.parse(textContent || '{}');
        errorMessage = parsed.error || textContent || error.message;
      } catch {
        errorMessage = error.message;
      }
    }
    return { url: null, error: errorMessage };
  }
  return { url: data?.url ?? null, error: null };
}

export async function createPortalSession(): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('customer-portal');
  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const textContent = await error.context?.text();
        const parsed = JSON.parse(textContent || '{}');
        errorMessage = parsed.error || textContent || error.message;
      } catch {
        errorMessage = error.message;
      }
    }
    return { url: null, error: errorMessage };
  }
  return { url: data?.url ?? null, error: null };
}

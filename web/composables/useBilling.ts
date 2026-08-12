import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface SubscriptionCheckout {
  checkoutUrl: string;
  mpSubscriptionId: string;
}

export interface CanceledSubscription {
  id: string;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
}

export const useBilling = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const createSubscriptionCheckout = async (
    backUrl?: string,
  ): Promise<ApiResponse<SubscriptionCheckout>> => {
    return await $customFetch<SubscriptionCheckout>(
      `${config.public.URL_BACKEND}/api/church/subscription/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
        },
        body: backUrl ? { backUrl } : {},
      },
    );
  };

  const cancelSubscription = async (): Promise<ApiResponse<CanceledSubscription>> => {
    return await $customFetch<CanceledSubscription>(
      `${config.public.URL_BACKEND}/api/church/subscription/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
        },
        body: {},
      },
    );
  };

  return { createSubscriptionCheckout, cancelSubscription };
};

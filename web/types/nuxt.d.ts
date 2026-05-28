// types/nuxt.d.ts
import type { FetchOptions } from "ofetch";
import { ApiResponse } from "../composables/useTypes";

export interface CustomFetch {
  (url: string, options?: FetchOptions): Promise<ApiResponse>;
}

declare module "#app" {
  interface NuxtApp {
    $customFetch: CustomFetch;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $customFetch: CustomFetch;
  }
}

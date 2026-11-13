import type { ComputedRef, MaybeRef } from 'vue'

type ComponentProps<T> = T extends new(...args: any) => { $props: infer P } ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any ? P
  : {}

declare module 'nuxt/app' {
  interface NuxtLayouts {
    default: ComponentProps<typeof import("/home/user/ChurchApp/web/app/layouts/default.vue").default>,
    "not-app-bottom": ComponentProps<typeof import("/home/user/ChurchApp/web/app/layouts/notAppBottom.vue").default>,
    public: ComponentProps<typeof import("/home/user/ChurchApp/web/app/layouts/public.vue").default>,
}
  export type LayoutKey = keyof NuxtLayouts extends never ? string : keyof NuxtLayouts
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}
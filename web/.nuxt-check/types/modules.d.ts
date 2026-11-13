import { NuxtModule, ModuleDependencyMeta } from '@nuxt/schema'
declare module '@nuxt/schema' {
  interface ModuleDependencies {
    ["@nuxtjs/tailwindcss"]?: ModuleDependencyMeta<typeof import("@nuxtjs/tailwindcss").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["vuetify-nuxt-module"]?: ModuleDependencyMeta<typeof import("vuetify-nuxt-module").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["motion-v"]?: ModuleDependencyMeta<typeof import("motion-v/nuxt").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["churchapp-defer-vuetify-mdi-styles"]?: ModuleDependencyMeta<typeof import("churchapp-defer-vuetify-mdi-styles").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["churchapp-defer-vuetify-mdi-styles"]?: ModuleDependencyMeta<typeof import("/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["@nuxt/telemetry"]?: ModuleDependencyMeta<typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
  }
  interface NuxtOptions {
    /**
     * Configuration for `@nuxtjs/tailwindcss`
     */
    ["tailwindcss"]: typeof import("@nuxtjs/tailwindcss").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `vuetify-nuxt-module`
     */
    ["vuetify"]: typeof import("vuetify-nuxt-module").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `motion-v/nuxt`
     */
    ["motionV"]: typeof import("motion-v/nuxt").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `churchapp-defer-vuetify-mdi-styles`
     */
    ["churchapp-defer-vuetify-mdi-styles"]: typeof import("churchapp-defer-vuetify-mdi-styles").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles`
     */
    ["churchapp-defer-vuetify-mdi-styles"]: typeof import("/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `@nuxt/telemetry`
     */
    ["telemetry"]: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
  }
  interface NuxtConfig {
    /**
     * Configuration for `@nuxtjs/tailwindcss`
     */
    ["tailwindcss"]?: typeof import("@nuxtjs/tailwindcss").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `vuetify-nuxt-module`
     */
    ["vuetify"]?: typeof import("vuetify-nuxt-module").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `motion-v/nuxt`
     */
    ["motionV"]?: typeof import("motion-v/nuxt").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `churchapp-defer-vuetify-mdi-styles`
     */
    ["churchapp-defer-vuetify-mdi-styles"]?: typeof import("churchapp-defer-vuetify-mdi-styles").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles`
     */
    ["churchapp-defer-vuetify-mdi-styles"]?: typeof import("/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `@nuxt/telemetry`
     */
    ["telemetry"]?: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    modules?: (undefined | null | false | NuxtModule<any> | string | [NuxtModule | string, Record<string, any>] | ["@nuxtjs/tailwindcss", Exclude<NuxtConfig["tailwindcss"], boolean>] | ["vuetify-nuxt-module", Exclude<NuxtConfig["vuetify"], boolean>] | ["motion-v/nuxt", Exclude<NuxtConfig["motionV"], boolean>] | ["churchapp-defer-vuetify-mdi-styles", Exclude<NuxtConfig["churchapp-defer-vuetify-mdi-styles"], boolean>] | ["/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles", Exclude<NuxtConfig["churchapp-defer-vuetify-mdi-styles"], boolean>] | ["@nuxt/telemetry", Exclude<NuxtConfig["telemetry"], boolean>])[],
  }
}
declare module 'nuxt/schema' {
  interface ModuleDependencies {
    ["@nuxtjs/tailwindcss"]?: ModuleDependencyMeta<typeof import("@nuxtjs/tailwindcss").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["vuetify-nuxt-module"]?: ModuleDependencyMeta<typeof import("vuetify-nuxt-module").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["motion-v"]?: ModuleDependencyMeta<typeof import("motion-v/nuxt").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["churchapp-defer-vuetify-mdi-styles"]?: ModuleDependencyMeta<typeof import("churchapp-defer-vuetify-mdi-styles").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["churchapp-defer-vuetify-mdi-styles"]?: ModuleDependencyMeta<typeof import("/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
    ["@nuxt/telemetry"]?: ModuleDependencyMeta<typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? O | false : Record<string, unknown>> | false
  }
  interface NuxtOptions {
    /**
     * Configuration for `@nuxtjs/tailwindcss`
     * @see https://www.npmjs.com/package/@nuxtjs/tailwindcss
     */
    ["tailwindcss"]: typeof import("@nuxtjs/tailwindcss").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `vuetify-nuxt-module`
     * @see https://www.npmjs.com/package/vuetify-nuxt-module
     */
    ["vuetify"]: typeof import("vuetify-nuxt-module").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `motion-v/nuxt`
     * @see https://www.npmjs.com/package/motion-v/nuxt
     */
    ["motionV"]: typeof import("motion-v/nuxt").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `churchapp-defer-vuetify-mdi-styles`
     * @see https://www.npmjs.com/package/churchapp-defer-vuetify-mdi-styles
     */
    ["churchapp-defer-vuetify-mdi-styles"]: typeof import("churchapp-defer-vuetify-mdi-styles").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles`
     * @see https://www.npmjs.com/package//home/user/ChurchApp/web/modules/deferVuetifyMdiStyles
     */
    ["churchapp-defer-vuetify-mdi-styles"]: typeof import("/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
    /**
     * Configuration for `@nuxt/telemetry`
     * @see https://www.npmjs.com/package/@nuxt/telemetry
     */
    ["telemetry"]: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? O | false : Record<string, any> | false
  }
  interface NuxtConfig {
    /**
     * Configuration for `@nuxtjs/tailwindcss`
     * @see https://www.npmjs.com/package/@nuxtjs/tailwindcss
     */
    ["tailwindcss"]?: typeof import("@nuxtjs/tailwindcss").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `vuetify-nuxt-module`
     * @see https://www.npmjs.com/package/vuetify-nuxt-module
     */
    ["vuetify"]?: typeof import("vuetify-nuxt-module").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `motion-v/nuxt`
     * @see https://www.npmjs.com/package/motion-v/nuxt
     */
    ["motionV"]?: typeof import("motion-v/nuxt").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `churchapp-defer-vuetify-mdi-styles`
     * @see https://www.npmjs.com/package/churchapp-defer-vuetify-mdi-styles
     */
    ["churchapp-defer-vuetify-mdi-styles"]?: typeof import("churchapp-defer-vuetify-mdi-styles").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles`
     * @see https://www.npmjs.com/package//home/user/ChurchApp/web/modules/deferVuetifyMdiStyles
     */
    ["churchapp-defer-vuetify-mdi-styles"]?: typeof import("/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    /**
     * Configuration for `@nuxt/telemetry`
     * @see https://www.npmjs.com/package/@nuxt/telemetry
     */
    ["telemetry"]?: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> | false : Record<string, any> | false
    modules?: (undefined | null | false | NuxtModule<any> | string | [NuxtModule | string, Record<string, any>] | ["@nuxtjs/tailwindcss", Exclude<NuxtConfig["tailwindcss"], boolean>] | ["vuetify-nuxt-module", Exclude<NuxtConfig["vuetify"], boolean>] | ["motion-v/nuxt", Exclude<NuxtConfig["motionV"], boolean>] | ["churchapp-defer-vuetify-mdi-styles", Exclude<NuxtConfig["churchapp-defer-vuetify-mdi-styles"], boolean>] | ["/home/user/ChurchApp/web/modules/deferVuetifyMdiStyles", Exclude<NuxtConfig["churchapp-defer-vuetify-mdi-styles"], boolean>] | ["@nuxt/telemetry", Exclude<NuxtConfig["telemetry"], boolean>])[],
  }
}
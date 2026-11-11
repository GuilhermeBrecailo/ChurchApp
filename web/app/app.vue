<template>
  <MotionConfig reduced-motion="user">
    <NuxtLoadingIndicator color="#b5472a" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <PwaInstallPrompt />
      <LazyDemoBar v-if="$config.public.DEMO" />
    </ClientOnly>
  </MotionConfig>
</template>

<template>
  <div v-if="embed" class="music-embed-player" :class="`music-embed-player--${embed.provider}`">
    <iframe
      :src="embed.src"
      :title="title || 'Player de música'"
      loading="lazy"
      frameborder="0"
      :allow="embed.allow"
      allowfullscreen
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  url?: string | null;
  title?: string;
}>();

type Embed = {
  provider: "youtube" | "spotify";
  src: string;
  allow: string;
};

// Sem lib externa: YouTube e Spotify ja fornecem iframes de embed oficiais,
// gratuitos e sem necessidade de API key para tocar uma unica faixa/video -
// adicionar uma dependencia (ex.: vue-plyr) so pra isso seria peso a mais
// sem ganho real, ja que nenhuma delas cobre os dois provedores.
function parseEmbed(rawUrl?: string | null): Embed | null {
  if (!rawUrl?.trim()) return null;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const videoId = url.pathname === "/watch" ? url.searchParams.get("v") : null;
    const shortsId = url.pathname.startsWith("/shorts/")
      ? url.pathname.split("/")[2]
      : null;
    const id = videoId || shortsId;
    if (!id) return null;

    return {
      provider: "youtube",
      src: `https://www.youtube.com/embed/${id}`,
      allow:
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    };
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (!id) return null;

    return {
      provider: "youtube",
      src: `https://www.youtube.com/embed/${id}`,
      allow:
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    };
  }

  if (host === "open.spotify.com") {
    const match = url.pathname.match(/^\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const [, type, id] = match;

    return {
      provider: "spotify",
      src: `https://open.spotify.com/embed/${type}/${id}`,
      allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
    };
  }

  return null;
}

const embed = computed(() => parseEmbed(props.url));
</script>

<style scoped>
.music-embed-player {
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-color-surface-alt, #f3f4f6);
}

.music-embed-player iframe {
  width: 100%;
  border: 0;
  display: block;
}

.music-embed-player--youtube {
  aspect-ratio: 16 / 9;
}

.music-embed-player--youtube iframe {
  height: 100%;
}

.music-embed-player--spotify iframe {
  height: 152px;
}
</style>

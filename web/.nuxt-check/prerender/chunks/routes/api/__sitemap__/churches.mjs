import { defineEventHandler } from 'file:///home/user/ChurchApp/web/node_modules/h3/dist/index.mjs';
import { u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/destr/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/hookable/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/ofetch/dist/node.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/node-mock-http/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/ufo/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/unstorage/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/unstorage/drivers/fs.mjs';
import 'node:crypto';
import 'file:///home/user/ChurchApp/web/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/unstorage/drivers/lru-cache.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/ohash/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/klona/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/defu/dist/defu.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/scule/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/unctx/dist/index.mjs';
import 'file:///home/user/ChurchApp/web/node_modules/radix3/dist/index.mjs';
import 'node:fs';
import 'node:url';
import 'file:///home/user/ChurchApp/web/node_modules/pathe/dist/index.mjs';

const churches = defineEventHandler(async () => {
  const config = useRuntimeConfig();
  try {
    const response = await $fetch(
      "/public/churches/sitemap",
      { baseURL: config.apiInternalBase }
    );
    return response.data.map((church) => ({
      loc: `/c/${church.slug}`,
      lastmod: church.updatedAt,
      changefreq: "weekly",
      priority: 0.7
    }));
  } catch {
    return [];
  }
});

export { churches as default };
//# sourceMappingURL=churches.mjs.map

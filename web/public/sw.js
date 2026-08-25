self.__APP_QUADRANGULAR_SW_VERSION__ = "2026-08-25-01";

const CACHE_NAME = `app-quadrangular-${self.__APP_QUADRANGULAR_SW_VERSION__}`;
const APP_SHELL = ["/", "/login", "/manifest.webmanifest", "/pwa-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("app-quadrangular-"))
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_nuxt/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // Always kick off a network fetch to refresh the cache, whether or
        // not we already have something to serve from it.
        const networkFetch = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => undefined);

        // Stale-while-revalidate: serve the cached shell immediately so the
        // app opens instantly, refresh happens in the background for next time.
        if (cachedResponse) return cachedResponse;

        const networkResponse = await networkFetch;
        if (networkResponse) return networkResponse;

        const cachedLogin = await caches.match("/login");
        const cachedHome = await caches.match("/");

        return (
          cachedLogin ||
          cachedHome ||
          new Response("ChurchApp offline", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          })
        );
      })(),
    );
    return;
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cachedResponse) =>
          cachedResponse ||
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            return response;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "AppChurch",
    body: "Você recebeu uma nova notificação.",
    url: "/user",
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    Promise.all([
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PUSH_NOTIFICATION_RECEIVED",
              payload,
            });
          });
        }),
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/pwa-icon-192.png",
        badge: "/pwa-icon-192.png",
        data: {
          notificationId: payload.notificationId,
          url: payload.url || "/user",
        },
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/user";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find((client) =>
          client.url.includes(self.location.origin),
        );

        if (existingClient) {
          existingClient.focus();
          existingClient.navigate(url);
          return;
        }

        return self.clients.openWindow(url);
      }),
  );
});

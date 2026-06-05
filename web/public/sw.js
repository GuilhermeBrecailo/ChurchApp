self.__APP_QUADRANGULAR_SW_VERSION__ = "2026-06-02-01";

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
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          const cachedLogin = await caches.match("/login");
          const cachedHome = await caches.match("/");

          return (
            cachedPage ||
            cachedLogin ||
            cachedHome ||
            new Response("App Quadrangular offline", {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
              },
            })
          );
        }),
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
    title: "App Quadrangular",
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
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      data: {
        url: payload.url || "/user",
      },
    }),
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

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "App Quadrangular",
    body: "Voce recebeu uma nova notificacao.",
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
      icon: "/pwa-icon.svg",
      badge: "/pwa-icon.svg",
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

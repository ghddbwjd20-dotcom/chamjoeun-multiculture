self.addEventListener("push", (event) => {
  let notice;
  try {
    notice = event.data?.json();
  } catch {
    return;
  }
  if (!notice || typeof notice.title !== "string") return;
  event.waitUntil(
    self.registration.showNotification(notice.title, {
      body: String(notice.body ?? ""),
      data: { url: String(notice.url ?? "/notifications") },
      icon: "/images/logo.png",
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target;
  try {
    target = new URL(
      event.notification.data?.url ?? "/notifications",
      self.location.origin,
    );
  } catch {
    return;
  }
  if (target.origin !== self.location.origin) return;
  event.waitUntil(self.clients.openWindow(target.href));
});

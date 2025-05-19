export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT:", error.message);
    return null;
  }
}
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
};

export const subscribePushNotification = async (token) => {
  const vapidPublicKey =
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
  const registration = await registerServiceWorker();
  if (registration) {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });

    const response = await fetch("/notifications/subscribe", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    const result = await response.json();
    if (!result.error) {
      console.log("Subscribed to push notifications:", result);
    } else {
      console.error("Failed to subscribe:", result.message);
    }
  }
};
export const unsubscribePushNotification = async (token) => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const response = await fetch("/notifications/subscribe", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    const result = await response.json();
    if (!result.error) {
      console.log("Unsubscribed from push notifications:", result);
      await subscription.unsubscribe();
    } else {
      console.error("Failed to unsubscribe:", result.message);
    }
  }
};

// Client-side Web Push helpers

export async function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function askNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

export async function getVapidPublicKey() {
  // Expect VAPID public key to be injected via env or endpoint; for now from env at build time
  return process.env.REACT_APP_VAPID_PUBLIC_KEY || '';
}

export async function subscribeUser(userId) {
  if (!(await isPushSupported())) return { success: false, message: 'Push not supported' };

  const permission = await askNotificationPermission();
  if (permission !== 'granted') return { success: false, message: 'Permission denied' };

  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) return { success: false, message: 'Missing VAPID key' };

  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey
  });

  const res = await fetch('/api/v1/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subscription })
  });
  if (!res.ok) return { success: false, message: 'Failed to save subscription' };
  return { success: true };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}



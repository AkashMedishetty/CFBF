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
  try {
    console.log('🔔 Starting push subscription for user:', userId);
    
    if (!(await isPushSupported())) {
      console.warn('Push not supported');
      return { success: false, message: 'Push not supported' };
    }

    const permission = await askNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return { success: false, message: 'Permission denied' };
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.warn('Missing VAPID key');
      return { success: false, message: 'Missing VAPID key' };
    }

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });

    console.log('Push subscription created:', subscription.endpoint);

    // Get auth token for the request
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Auth token added to request');
    } else {
      console.warn('No auth token found');
    }

    const res = await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, subscription })
    });
    
    console.log('📡 Push subscription API response:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Push subscription failed:', res.status, errorText);
      return { success: false, message: `Failed to save subscription: ${res.status} ${errorText}` };
    }
    
    console.log('Push subscription saved successfully');
    return { success: true };
  } catch (error) {
    console.error('💥 Push subscription error:', error);
    return { success: false, message: error.message };
  }
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



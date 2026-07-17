// Notification service — FCM + web push + in-app notifications
const prisma = require('../utils/prisma');

/**
 * Send notification (in-app DB + FCM push + web push)
 * Single function used by all controllers — no duplication
 */
const sendNotification = async ({ userId, fcmToken, title, body, type, data }) => {
  try {
    // Always store in-app notification
    await prisma.notification.create({
      data: { userId, title, body, type, data: data || {} },
    });

    // Send FCM push if token available
    if (fcmToken && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      await sendFCM({ fcmToken, title, body, data });
    }

    // Send web push (VAPID) to all browser subscriptions
    await sendWebPush(userId, title, body, data);
  } catch (err) {
    console.error('Notification error:', err.message);
    // Non-critical: don't throw
  }
};

const sendFCM = async ({ fcmToken, title, body, data }) => {
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
    });
  } catch (err) {
    console.error('FCM send error:', err.message);
  }
};

const sendWebPush = async (userId, title, body, data = {}) => {
  try {
    const webpush = require('web-push');
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@quikden.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (!subscriptions.length) return;

    const payload = JSON.stringify({ title, body, data });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }
  } catch (err) {
    console.error('Web push error:', err.message);
  }
};

module.exports = { sendNotification };

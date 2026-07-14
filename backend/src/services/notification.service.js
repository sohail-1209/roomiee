// Notification service — FCM + in-app notifications
const prisma = require('../utils/prisma');

/**
 * Send notification (in-app DB + optional FCM push)
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

module.exports = { sendNotification };

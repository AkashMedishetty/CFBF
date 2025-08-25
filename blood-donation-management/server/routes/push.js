const express = require('express');
const webpush = require('web-push');
const logger = require('../utils/logger');

const router = express.Router();

// Configure VAPID keys (set via env)
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:info@callforbloodfoundation.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
  logger.warn('VAPID keys are not configured. Web Push will be disabled.', 'PUSH_ROUTES');
}

const PushSubscription = require('../models/PushSubscription');

// Save a push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription is required' });
    }
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: userId || null, endpoint, keys },
      { upsert: true, new: true }
    );
    logger.info(`Saved push subscription for ${userId || 'anon'}`, 'PUSH_ROUTES');
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to save subscription', 'PUSH_ROUTES', err);
    res.status(500).json({ success: false, message: 'Failed to save subscription' });
  }
});

// Send a test notification
router.post('/test', async (req, res) => {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return res.status(400).json({ success: false, message: 'VAPID not configured' });
    }
    const { userId, title = 'CallforBlood Foundation', body = 'Notifications enabled', data = {} } = req.body || {};
    let subs = [];
    if (userId) {
      subs = await PushSubscription.find({ userId });
    } else {
      subs = await PushSubscription.find().limit(1);
    }
    if (!subs.length) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }
    await Promise.all(subs.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify({ title, body, data }))));
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to send test push', 'PUSH_ROUTES', err);
    res.status(500).json({ success: false, message: 'Failed to send test push' });
  }
});

module.exports = router;



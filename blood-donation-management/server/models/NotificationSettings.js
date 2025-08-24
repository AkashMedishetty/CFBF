const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  channelOrder: {
    type: [String],
    enum: ['push', 'email', 'whatsapp', 'sms'],
    default: ['push', 'email']
  },
  enableWhatsApp: { type: Boolean, default: false },
  enableSMS: { type: Boolean, default: false },
  escalateToWhatsAppOnPriority: {
    type: [String],
    enum: ['critical', 'urgent', 'normal'],
    default: []
  },
  escalateToSMSOnPriority: {
    type: [String],
    enum: ['critical', 'urgent', 'normal'],
    default: []
  },
  escalateAfterMs: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

notificationSettingsSchema.statics.getSettings = async function() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);



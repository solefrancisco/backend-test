const crypto = require('crypto');

function hmacApiKey(apiKey) {
  const secret = process.env.NOTIFIER_API_KEY_HMAC_SECRET;

  return crypto
    .createHmac('sha256', secret)
    .update(apiKey, 'utf8')
    .digest('hex');
}

module.exports = { hmacApiKey };
const crypto = require('crypto');
const { env } = require('@notify/configs/env.config');

const IV_LENGTH = env.aesIvLength;
const ALGORITHM = env.aesAlgorithm;
const AUTH_TAG_LENGTH = env.aesAuthTagLength;

function hashHmac(apiKey) {
  const secret = env.hmacSecret;

  return crypto
    .createHmac('sha256', secret)
    .update(apiKey, 'utf8')
    .digest('hex');
}

function getEncryptionKey() {
  const secret = env.aesSecret;

  if (!secret) {
    throw new Error('Missing environment variable: NOTIFIER_AES_SECRET');
  }

  return crypto
    .createHash('sha256')
    .update(secret)
    .digest();
}

function aesEncrypt(value) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

function aesDecrypt(encryptedValue) {
  const [ivHex, authTagHex, encryptedHex] = encryptedValue.split(':');

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted value format');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = { hashHmac, aesEncrypt, aesDecrypt };
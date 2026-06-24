const { z } = require('zod');

const getNotificationByUuidSchema = z.object({
  uuid: z.string().uuid()
});

module.exports = { getNotificationByUuidSchema };
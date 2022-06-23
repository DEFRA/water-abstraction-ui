const services = require('../../lib/connectors/services')
const { logger } = require('../../logger')
const callback = async (request, h) => {
  const receivedToken = request.headers.authorization ? request.headers.authorization.replace('Bearer ', '') : null
  if (receivedToken !== process.env.NOTIFY_CALLBACK_TOKEN) {
    logger.info('A Notify callback request was declined due to token mismatch.')
    return h.response('Unauthorized').code(403)
  }

  services.water.notify.postNotifyCallback(request.payload)
  return h.response(null).code(204)
}

exports.callback = callback

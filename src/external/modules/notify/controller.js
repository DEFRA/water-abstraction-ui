const services = require('../../lib/connectors/services')
const { logger } = require('../../logger')
const callback = async (request, h) => {
  const receivedToken = request.headers.authorization ? request.headers.authorization.replace('Bearer ', '') : null
  if (receivedToken !== process.env.NOTIFY_CALLBACK_TOKEN) {
    logger.info('A Notify callback request was declined due to token mismatch.')
    return h.response('Unauthorized').code(403)
  }

  try {
    await services.water.notify.postNotifyCallback(request.payload)
  } catch (error) {
    logger.info(`A Notify callback request was declined due to HTTP error code ${error.statusCode}`)
    return h.response(null).code(error.statusCode)
  }

  return h.response(null).code(204)
}

exports.callback = callback

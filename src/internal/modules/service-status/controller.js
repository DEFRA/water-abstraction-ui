'use strict'

const getServiceStatus = async (_request, h) => {
  return h.redirect('/system/health/info')
}

exports.getServiceStatus = getServiceStatus

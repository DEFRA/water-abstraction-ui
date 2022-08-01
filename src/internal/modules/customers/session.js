'use strict'

const getSessionKey = request => `company-contact.${request.params.companyId}.${request.defra.userId}`

const get = request => {
  const key = getSessionKey(request)
  return request.yar.get(key) || {}
}

const set = (request, data) => {
  const key = getSessionKey(request)
  return request.yar.set(key, data)
}

const merge = (request, data) => {
  const existingData = get(request)
  return set(request, {
    ...existingData,
    ...data
  })
}

const clear = request => set(request, {})

exports.getSessionKey = getSessionKey
exports.get = get
exports.set = set
exports.merge = merge
exports.clear = clear

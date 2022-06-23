'use strict'

const SESSION_KEY = 'notePlugin'

const getSessionKey = noteId => `${SESSION_KEY}.${noteId}`

const get = (request, key) => request.yar.get(getSessionKey(key))

const set = (request, key, data) => request.yar.set(getSessionKey(key), data)

const clear = (request, key) => set(request, key, {})

const merge = (request, key, data) => {
  const existingData = get(request, key)
  return set(request, key, {
    ...existingData,
    ...data
  })
}

exports.get = get
exports.set = set
exports.clear = clear
exports.merge = merge

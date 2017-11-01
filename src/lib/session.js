const moment = require('moment')
const Helpers = require('./helpers')

function sessionGet(request, key) {
  //  updateSessionTimestamp(request)
  if (request.session.id) {

  } else {
    console.log('START SESSION')
    request.session.id = Helpers.createGUID()

  }

  //session = request.yar.get('session')
  if (request.session[key]) {
    return request.session[key]
  } else {
    return null
  }
}

function sessionSet(request, key, value) {
  console.log("session " + key + "is set with ")
  console.log(value)
  console.log('******')
  request.session[key] = value
}

function updateSessionTimestamp(request) {
  //TODO: hanbdler session expiry

}

module.exports = {
  get: sessionGet,
  set: sessionSet,
  updateTimestamp: updateSessionTimestamp
}

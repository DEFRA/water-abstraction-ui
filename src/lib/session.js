const moment = require('moment')
const Helpers = require('./helpers')

function sessionGet (request) {
  updateSessionTimestamp(request)
  session = request.yar.get('session')
  if (session) {
    return session
  } else {
    console.log('START SESSION')
    session = {id: Helpers.createGUID()}
    sessionSet(request, session)
    return session
  }
}

function sessionSet (request, session) {
  request.yar.set('session', session)
  return
}

function updateSessionTimestamp(request){
  //TODO: hanbdler session expiry

}

module.exports = {
  get: sessionGet,
  set: sessionSet,
  updateTimestamp:updateSessionTimestamp
}

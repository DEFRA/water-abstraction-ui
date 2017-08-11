const moment = require('moment')

function sessionGet (request) {
  updateSessionTimestamp(request)
  session = request.yar.get('session')
  if (session) {
    console.log('GET SESSION')
    console.log(session)
    return session
  } else {
    console.log('START SESSION')
    session = {id: Helpers.createGUID()}
    sessionSet(request, session)
    return session
  }
}

function sessionSet (request, session) {
  console.log('SET SESSION')
  console.log(session)
  request.yar.set('session', session)
  return
}

function updateSessionTimestamp(request){
  console.log('*** updateSessionTimestamp ***')
  var currentSession=moment().unix()
  console.log('this sesion '+currentSession)

  request.yar.set('sessionUnixTime',currentSession);


}

module.exports = {
  get: sessionGet,
  set: sessionSet,
  updateTimestamp:updateSessionTimestamp
}

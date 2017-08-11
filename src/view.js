const Session = require('./session')

function viewContextDefaults (request) {
  var viewContext = {}

//  console.log (getSessionAge(request));

  viewContext.session = Session.get(request)




  console.log('VIEW CONTEXT SESSION')
  console.log(viewContext.session)

//  request.session.id = request.session.id || Helpers.createGUID()
//  request.session.pageviews = request.session.pageviews + 1 || 1

//  console.log(request.session)

//  viewContext.session = request.session
  viewContext.pageTitle = 'Water Abstraction'
  viewContext.insideHeader = ''
  viewContext.headerClass = 'with-proposition'
  viewContext.topOfPage = null
  viewContext.head = null
  viewContext.bodyStart = null
  viewContext.afterHeader = null
  viewContext.path = request.path
  viewContext.debug = {}
  viewContext.debug.connection = request.connection.info
  viewContext.debug.request = request.info
  viewContext.debug.request.path = request.path
  viewContext.debug.session=request.yar.get('sessionTimestamp')
  return viewContext
}

module.exports = {
  getViewContextDefaults: viewContextDefaults
}

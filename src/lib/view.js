console.log(__dirname)

function viewContextDefaults(request) {
  var viewContext = {}

  viewContext.query = request.query;
  viewContext.payload = request.payload;
  viewContext.session = request.session
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
  //  viewContext.debug.session = request.yar.get('sessionTimestamp')

  viewContext.user=request.auth.credentials

  return viewContext
}

module.exports = {
  contextDefaults: viewContextDefaults
}

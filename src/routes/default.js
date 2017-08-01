
const Helpers = require('../helpers')
const User = require('../user')

function viewContextDefaults (request) {
  var viewContext = {}
  request.session.id = request.session.id || Helpers.createGUID()
  request.session.pageviews = request.session.pageviews + 1 || 1
  viewContext.session = request.session
  viewContext.pageTitle = 'Water Abstraction'
  viewContext.insideHeader = ''
  viewContext.headerClass = 'with-proposition'
  viewContext.topOfPage = null
  viewContext.head = null
  viewContext.bodyStart = null
  viewContext.afterHeader = null
  viewContext.debug = {}
  viewContext.debug.connection = request.connection.info
  viewContext.debug.request = request.info
  return viewContext
}

function getRoot (request, reply) {
  var viewContext = viewContextDefaults(request)
  reply.view('water/index', viewContext)
}

function getSignin (request, reply) {
  var viewContext = viewContextDefaults(request)
  reply.view('water/signin', viewContext)
}

function postRoot (request, reply) {
  if (request.payload && request.payload.user_id && request.payload.password) {
    var getUser = User.authenticate(request.payload.user_id, request.payload.password)
    if (getUser.status) {
      request.session.user = getUser.user
      var httpRequest = require('request')
      httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/licences', function (error, response, body) {
        var viewContext = viewContextDefaults(request)
        viewContext.licenceData = JSON.parse(body)
        viewContext.licence = body
        reply.view('water/licences', viewContext)
      })
    } else {
      var viewContext = viewContextDefaults(request)
      viewContext.payload = request.payload
      viewContext.errors = {}
      viewContext.errors['authentication'] = 1

      reply.view('water/signin', viewContext)
    }
  } else {
    var viewContext = viewContextDefaults(request)
    viewContext.payload = request.payload
    viewContext.errors = {}
//    viewContext.errors['password']=1;
    if (!request.payload.user_id) {
      viewContext.errors['user-id'] = 1
    }

    if (!request.payload.password) {
      viewContext.errors['password'] = 1
    }

    reply.view('water/signin', viewContext)
  }
}


function getLicences(request, reply) {
  var httpRequest = require('request')
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/licences', function (error, response, body) {
    var viewContext = viewContextDefaults(request)

    try {
      viewContext.licenceData = JSON.parse(body)

      viewContext.licence = body
    } catch (e) {
      ;
    }
    reply.view('water/licences', viewContext)
  })
}

function getLicence(request, reply) {
  var httpRequest = require('request')
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
    var viewContext = viewContextDefaults(request)
    viewContext.licence_id = request.params.licence_id
    viewContext.licenceData = JSON.parse(body)
    viewContext.licence = body
    reply.view('water/licence', viewContext)
  })
}

function getLicenceContact(request, reply) {
  var httpRequest = require('request')
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
    var viewContext = viewContextDefaults(request)
    viewContext.licence_id = request.params.licence_id
    viewContext.licenceData = JSON.parse(body)
    viewContext.licence = body
    reply.view('water/licences_contact', viewContext)
  })
}

function getLicenceMap(request, reply) {
  var httpRequest = require('request')
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
    var viewContext = viewContextDefaults(request)
    viewContext.licence_id = request.params.licence_id
    viewContext.licenceData = JSON.parse(body)
    viewContext.licence = body
    reply.view('water/licences_map', viewContext)
  })
}

function getLicenceTerms(request, reply) {
  var httpRequest = require('request')
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
    var viewContext = viewContextDefaults(request)
    viewContext.licence_id = request.params.licence_id
    viewContext.licenceData = JSON.parse(body)
    viewContext.licence = body
    reply.view('water/licences_terms', viewContext)
  })
}

module.exports = [

  { method: 'GET', path: '/', handler: getRoot },
  { method: 'GET', path: '/signin', handler: getSignin },
  { method: 'POST', path: '/signin', handler: postRoot },
  { method: 'GET', path: '/licences', handler: getLicences },
  { method: 'GET', path: '/licences/{licence_id}', handler: getLicence  },
  { method: 'GET', path: '/licences/{licence_id}/contact', handler: getLicenceContact  },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: getLicenceMap  },
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: getLicenceTerms  }

]

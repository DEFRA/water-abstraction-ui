
const helpers = require('../helpers')

function viewContextDefaults (request) {
  var viewContext = {}
  request.session.id = request.session.id || helpers.createGUID()
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

module.exports = [

  { method: 'GET', path: '/', handler: function (request, reply) {
    var viewContext = viewContextDefaults(request)
    reply.view('water/index', viewContext)
  } },
  { method: 'GET', path: '/signin', handler: function (request, reply) {
    var viewContext = viewContextDefaults(request)

    reply.view('water/signin', viewContext)
  } },

  { method: 'POST', path: '/signin', handler: function (request, reply) {
    if (request.payload && request.payload.user_id) {
      request.session.user_id = request.payload.user_id
    }

    var httpRequest = require('request')
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/licences', function (error, response, body) {
      var viewContext = viewContextDefaults(request)
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences', viewContext)
    })
  } },

  { method: 'GET', path: '/licences', handler: function (request, reply) {
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
  } },
  { method: 'GET', path: '/licences/{licence_id}', handler: function (request, reply) {
    var httpRequest = require('request')
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licence', viewContext)
    })
  } },
  { method: 'GET', path: '/licences/{licence_id}/contact', handler: function (request, reply) {
    var httpRequest = require('request')
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_contact', viewContext)
    })
  } },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: function (request, reply) {
    var httpRequest = require('request')
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_map', viewContext)
    })
  } },
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: function (request, reply) {
    var httpRequest = require('request')
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_terms', viewContext)
    })
  } }

]

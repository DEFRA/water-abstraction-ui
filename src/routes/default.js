
const helpers = require('../helpers')

function viewContextDefaults (request) {
  var viewContext = {}
  request.session.id = request.session.id || helpers.createGUID()
  if(request.session && request.session.pageviews){
    console.log("session found");
  } else {
    console.log("no session found");
  }
  request.session.pageviews = request.session.pageviews + 1 || 1
  viewContext.session = request.session
  viewContext.pageTitle = 'Water Abstraction'
  viewContext.insideHeader = 'View my water resource licence online prototype: Alpha'
  viewContext.insideHeader = 'Water resource licensing service'
  viewContext.headerClass = 'with-proposition'
  viewContext.topOfPage = null
  viewContext.head = null
  viewContext.bodyStart = null
  viewContext.afterHeader = null
  return viewContext
}

module.exports = [


  { method: 'GET', path: '/', handler: function (request, reply) {
    console.log('requested index page')
    var viewContext = viewContextDefaults(request)
    reply.view('water/index', viewContext)
  } },
  { method: 'GET', path: '/signin', handler: function (request, reply) {
    console.log('requested signin page')

    var viewContext = viewContextDefaults(request)

    reply.view('water/signin', viewContext)
  } },

  { method: 'POST', path: '/signin', handler: function (request, reply) {
    console.log('requested signin POST page')
    console.log(request.payload.user_id);
    request.session.user_id=request.payload.user_id


    var httpRequest = require('request')
    httpRequest('/public/data/licences/licences.json', function (error, response, body) {
      // console.log('error:', error); // Print the error if one occurred
      // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.

      var viewContext = viewContextDefaults(request)
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences', viewContext)
    })
  } },


  { method: 'GET', path: '/licences', handler: function (request, reply) {
    console.log('requested signin page')


    var httpRequest = require('request')
    httpRequest('/public/data/licences/licences.json', function (error, response, body) {
      // console.log('error:', error); // Print the error if one occurred
      // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.

      var viewContext = viewContextDefaults(request)
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences', viewContext)
    })
  } },
  { method: 'GET', path: '/licences/{licence_id}', handler: function (request, reply) {
    console.log('requested signin page')
    console.log('request params: ')
    console.log(request.params)

    console.log('query string: ')
    console.log(request.query)

    var httpRequest = require('request')
    httpRequest('/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
  // console.log('error:', error); // Print the error if one occurred
  // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  // console.log('body:', body); // Print the HTML for the Google homepage.

      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      console.log(body);
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licence', viewContext)
    })
  } },
  { method: 'GET', path: '/licences/{licence_id}/contact', handler: function (request, reply) {
    console.log('requested contact page')




    var httpRequest = require('request')
    httpRequest('/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      // console.log('error:', error); // Print the error if one occurred
      // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.

      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_contact', viewContext)
    })
  } },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: function (request, reply) {
    console.log('requested map page')




        var httpRequest = require('request')
        httpRequest('/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
          // console.log('error:', error); // Print the error if one occurred
          // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          // console.log('body:', body); // Print the HTML for the Google homepage.

          var viewContext = viewContextDefaults(request)
          viewContext.licence_id = request.params.licence_id
          viewContext.licenceData = JSON.parse(body)
          viewContext.licence = body
          reply.view('water/licences_map', viewContext)
        })
  } },
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: function (request, reply) {
    console.log('requested terms page')
    var httpRequest = require('request')
    httpRequest('/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      // console.log('error:', error); // Print the error if one occurred
      // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.

      var viewContext = viewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_terms', viewContext)
    })
  } }

]

/*
API page, pending real back end - uses fs to read and write to lkocal json files...

*/
const helpers = require('../helpers')
const licences = require('../licences')

function viewContextDefaults (request) {
  var viewContext = {}
  return viewContext
}

const version = '1.0'

module.exports = [

  { method: 'POST', path: '/API/' + version + '/licences', handler: function (request, reply) {
  // create a new licence
    var newLicence = licences.create(request.payload)
    reply(newLicence)
  } },

  { method: 'GET', path: '/API/' + version + '/licences', handler: function (request, reply) {
  // return all licences
    var data = {}
    var allLicences = licences.list()
    reply(allLicences)
  } },

  { method: 'GET', path: '/API/' + version + '/licences/{id}', handler: function (request, reply) {
  // return all licences
    var data = {}
    var licence = licences.get(request.params.id + '.json')
    reply(licence)
  } },

  { method: 'PUT', path: '/API/' + version + '/licences/{id}', handler: function (request, reply) {
  // update specific licence
    var data = {}
    var update = licences.update(request.params.id, request.payload)
    reply(update)
  } }
]

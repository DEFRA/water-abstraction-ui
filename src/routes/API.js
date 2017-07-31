/*
API page, pending real back end - uses fs to read and write to lkocal json files...

*/
const helpers = require('../helpers')
const licences = require('../licences')

const version = '1.0'

function licencesPostHandler(request, reply) {
// create a new licence
  var newLicence = licences.create(request.payload)
  reply(newLicence)
}

function licencesGetHandler(request, reply) {
// return all licences
  var data = {}
  var allLicences = licences.list()
  reply(allLicences)
}

function licenceGetHandler(request, reply) {
// return all licences
  var data = {}
  var licence = licences.get(request.params.id + '.json')
  reply(licence)
}

function licencePutHandler(request, reply) {
// update specific licence
  var data = {}
  var update = licences.update(request.params.id, request.payload)
  reply(update)
}

module.exports = [

  { method: 'POST', path: '/API/' + version + '/licences', handler: licencesPostHandler },

  { method: 'GET', path: '/API/' + version + '/licences', handler: licencesGetHandler },

  { method: 'GET', path: '/API/' + version + '/licences/{id}', handler: licenceGetHandler },

  { method: 'PUT', path: '/API/' + version + '/licences/{id}', handler: licencePutHandler  }
]

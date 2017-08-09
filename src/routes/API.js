/*
API page, pending real back end - uses fs to read and write to lkocal json files...

*/
const Licences = require('../licences')
const Orgs = require('../orgs')


const version = '1.0'

function licencesPostHandler(request, reply) {
// create a new licence
  var newLicence = Licences.create(request.payload)
  reply(newLicence)
}

function licencesListHandler(request, reply) {
// return all licences
  var data = {}
  var allLicences = Licences.list((data)=>{
    console.log('got data!')
    console.log(data)
    reply(data)

  })
}

function licenceGetHandler(request, reply) {
// return all licences
  var data = {}
  var licence = Licences.get(request.params.id + '.json')
  reply(licence)
}

function licencePutHandler(request, reply) {
// update specific licence
  var data = {}
  var update = Licences.update(request.params.id, request.payload)
  reply(update)
}

function orgsListHandler(request, reply) {
// return all licences
  var data = {}
  var licence = Orgs.list((data)=>{
    console.log('got data!')
    console.log(data)
    reply(data)

  })
}

function getLicencesByOrgandType(request,reply){
  // return all licences for supplied type and org
    var data = {}
    var licence = Orgs.listLicencesByOrgAndType(request.params,(data)=>{
      console.log('got data!')
      console.log(data)
      reply(data)

    })
}

function getLicenceByOrgTypeID(request,reply){
  // return all licences for supplied type and org
    var data = {}
    var licence = Licences.getLicenceByOrgTypeID(request.params,(data)=>{
      console.log('got data!')
      reply(data)

    })
}

function getLicenceDefinitionByOrgType(request,reply){
  // return all licences for supplied type and org
    var data = {}
    var licence = Orgs.getLicenceDefinitionByOrgType(request.params,(data)=>{
      console.log('got data!')
      reply(data)

    })
}
function test(request,reply){

  const { Client } = require('pg')
  const client = new Client()

  client.connect()

  client.query('SELECT * from licences', [], (err, res) => {
    if(err){
    console.log(err ? err.stack : 'No query errors') // Hello World!
    }

    reply(JSON.stringify(res.rows[0]));
    client.end()
  })

}

module.exports = [
  { method: 'GET', path: '/API/' + version + '/orgs', handler: orgsListHandler },
  { method: 'GET', path: '/API/' + version + '/orgs/{orgId}/types/{typeId}/licences', handler: getLicencesByOrgandType },
  { method: 'GET', path: '/API/' + version + '/orgs/{orgId}/types/{typeId}/licences/{licenceId}', handler: getLicenceByOrgTypeID },
  { method: 'GET', path: '/API/' + version + '/orgs/{orgId}/types/{typeId}/definition', handler: getLicenceDefinitionByOrgType },

  { method: 'GET', path: '/API/' + version + '/test', handler: test },
  { method: 'POST', path: '/API/' + version + '/licences', handler: licencesPostHandler },
  { method: 'GET', path: '/API/' + version + '/licences', handler: licencesListHandler },
  { method: 'GET', path: '/API/' + version + '/licences/{id}', handler: licenceGetHandler },
  { method: 'PUT', path: '/API/' + version + '/licences/{id}', handler: licencePutHandler  }

]

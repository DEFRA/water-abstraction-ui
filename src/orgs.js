const fs = require('fs')
const Helpers = require('./helpers')



function getOrgs (cb) {
  const { Client } = require('pg')
  const client = new Client()
  client.connect()

  client.query('SELECT * from org', [], (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}

function listLicencesByOrgAndType (data,cb) {
  const { Client } = require('pg')
  const client = new Client()
  console.log(data)
  client.connect()
  var queryParams=[data.orgId, data.typeId]
  client.query('SELECT * from licence where licence_org_id=$1 and licence_type_id=$2', queryParams, (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}

function getLicenceDefinitionByOrgType (data,cb) {
  const { Client } = require('pg')
  const client = new Client()
  console.log(data)
  client.connect()
  var queryParams=[data.typeId]
  var query=`SELECT $1::int as type_id, array_to_json(array_agg(attributes)) as attributeData
	from (
select
		tf.type_fields_id,tf.field_id,f.field_nm,f.field_definition
		from type_fields tf
		inner join field f on tf.field_id = f.field_id
        where tf.type_id=1 ) attributes
        `

  console.log(query);

//'SELECT * from licence where licence_org_id=$1 and licence_type_id=$2'

  client.query(query, queryParams, (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}

module.exports = {
  list: getOrgs,
  listLicencesByOrgAndType:listLicencesByOrgAndType,
  getLicenceDefinitionByOrgType: getLicenceDefinitionByOrgType

}

/**
,
get: getLicence,
update: updateLicence,
create: createLicence,
summary: getLicenceSummary,
delete: deleteLicence
**/

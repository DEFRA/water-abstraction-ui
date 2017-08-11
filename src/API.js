const fs = require('fs')
const baseFilePath = __dirname + '/../public/data/licences/'
const Helpers = require('./helpers')
const { Client } = require('pg')


function getFields (cb) {
  const client = new Client()
  client.connect()
  client.query('SELECT * from field', [], (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}

function getOrgs (cb) {
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

function getOrg(params,cb){
  const client = new Client()
  client.connect()
  client.query('SELECT * from org where org_id = $1', [params.orgId], (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}

function createOrg(params,cb){
  console.log('got payload')
  console.log(params);
  const client = new Client()
  client.connect()

  client.query('insert into org values ($1) RETURNING org_id', [params.org_nm], (err, res) => {
    if (err){
      console.log(err)
      cb(err)
    } else {
    cb(res.rows)
    client.end()
    }


  })



}

function updateOrg(request,cb){

  const client = new Client()
  client.connect()
  console.log('update org')
  console.log(request.params.orgId);
  console.log(request.payload.org_nm);
  client.query('update org set org_nm = $2 where org_id = $1', [request.params.orgId, request.payload.org_nm], (err, res) => {
    if (err){
      console.log(err)
      cb(err)
    } else {
    cb(res.rows)
    client.end()
    }


  })

}

function deleteOrg(cb){

}

function getTypes(data,cb) {
  const client = new Client()
  console.log(data)
  client.connect()
  var queryParams=[data.orgId]
  var query=`SELECT type_nm,type_id from type where org_id=$1`
  console.log(query);
  client.query(query, queryParams, (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}



function getType(data,cb) {
  const client = new Client()
  console.log(data)
  client.connect()
  var queryParams=[data.typeId]
  var query=`SELECT $1::int as type_id, array_to_json(array_agg(attributes)) as attributeData
	from (
select
		tf.type_fields_id,tf.field_id,tf.type_field_alias,f.field_definition,tf.is_required,tf.is_public_domain,f.field_nm
		from type_fields tf
		inner join field f on tf.field_id = f.field_id
        where tf.type_id=$1 ) attributes
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
function createType(request,cb) {
  const client = new Client()
  client.connect()

  client.query('insert into type (type_nm,org_id) values ($1,$2) RETURNING type_id', [request.payload.type_nm,request.params.orgId], (err, res) => {
    if (err){
      console.log(err)
      cb(err)
    } else {
    cb(res.rows)
    client.end()
    }


  })

}

function updateType(cb){

}

function deleteType(cb){

}

function getLicences(data,cb){
  const client = new Client()
  console.log(data)
  client.connect()
  var queryParams=[data.orgId,data.typeId]
  var query=`SELECT licence_id, licence_ref, licence_search_key from licence where licence_org_id=$1 and licence_type_id=$2`

  client.query(query, queryParams, (err, res) => {
    if (err){
      console.log(err);
      cb(err)
      client.end()

    } else {
      console.log(res.rows)
      cb(res.rows)
    client.end()
    }

  })

}

function getLicence(data, cb) {
  console.log(data)
  const client = new Client()
  client.connect()
  var queryParams = [data.orgId, data.typeId, data.licenceId]
  // swanky query to get the licence data
  var query = `
  select l.*,a.* from
  (
	SELECT licence_id,array_to_json(array_agg(attributes)) as attributeData
	from
		(
		select
		licence_id,type_field_alias, licence_data_value,ld.type_fields_id,tf.field_id
		from licence_data ld
		inner join type_fields tf on ld.type_fields_id = tf.type_fields_id
		inner join field f on tf.field_id = f.field_id
    where ld.licence_id=$3 and
    tf.type_id=$2
        ) attributes
	group by licence_id
) a
inner join licence l on a.licence_id = l.licence_id
where l.licence_org_id = $1 and l.licence_type_id=$2
`
  console.log('perform query')

  client.query(query, queryParams, (err, res) => {
    if (err) {
      console.log(err ? err.stack : 'No query errors')
    }

    client.end()

/**
convert licence data to nice friendly format, separating core values (common to all licences regardless of type) and licence/org type specific attributes
**/
var licenceData = {}

    if(res.rows.length == 0){

    } else {
    licenceData.licence_id = res.rows[0].licence_id
    licenceData.licence_ref = res.rows[0].licence_ref
    licenceData.licence_start_dt = res.rows[0].licence_start_dt
    licenceData.licence_end_dt = res.rows[0].licence_end_dt
    licenceData.licence_status_id = res.rows[0].licence_status_id
    licenceData.licence_type_id = res.rows[0].licence_type_id
    licenceData.licence_org_id = res.rows[0].licence_org_id
    licenceData.attributes = {}
    for (attribute in res.rows[0].attributedata) {
      licenceData.attributes[res.rows[0].attributedata[attribute].type_field_alias] = res.rows[0].attributedata[attribute].licence_data_value
    }
    }
    cb(licenceData)
  })
}

function createLicence(request, cb) {
  //TODO: Deal with single quotes in query params using: var b = a.replace(/'/g, '"');
  var payload = request.payload
  const client = new Client()

  var foundErrors = false
  var errors = []


  function reject (msg) {
    cb({'error': msg})
    try{
      client.end()
    }catch(e){
        console.log(e)
    }
    return
  }
  // convert incoming JSON to series of queries...

  client.connect()

  // 1. check primary attributes
  if (typeof payload.licence_id !== 'undefined') {
    reject('cannot post existing licence id')
  } else if (typeof payload.licence_ref === 'undefined') {
    reject('licence_ref must be defined')
  } else if (typeof payload.licence_type_id === 'undefined') {
    reject('licence_type_id must be defined')
  } else if (typeof payload.licence_org_id === 'undefined') {
    reject('licence_org_id must be defined')
  } else {
    console.log('primary fields validated')
    // 2. get secondary attributes by licence_type_id (and verify licence_org_id is correct for licence_type_id)

    var queryParams = [request.params.orgId, request.params.typeId]
    // this query will only return records where type_id is defined for orgId
    var query = `SELECT array_to_json(array_agg(attributes)) as attributeData
    from (
    select
      tf.type_fields_id,tf.field_id,tf.type_field_alias,f.field_definition, tf.is_required
      from type_fields tf
      inner join field f on tf.field_id = f.field_id
      inner join type t on tf.type_id = t.type_id
          where tf.type_id=$2 and t.org_id=$1 ) attributes
          `

    client.query(query, queryParams, (err, res) => {
      if (err) {
        console.log(err ? err.stack : res.rows[0])
      } else {
        console.log('no db error')
      }

      // build structure containing all attributes so we can verify against payload attributes...
      var returnedAttributeDefinition = res.rows[0].attributedata
      var attributeDefinitions = {}
      for (attribute in returnedAttributeDefinition) {
        var thisAttribute = returnedAttributeDefinition[attribute]
        attributeDefinitions[thisAttribute.type_field_alias] = thisAttribute
      }
      console.log(attributeDefinitions)

    // 3. iterate over the secondary attributes and check they exist...
      var searchKey = ''

    // check for missing required fileds

      for (secondaryAttribute in attributeDefinitions) {
        console.log('*** ' + secondaryAttribute)
        console.log(payload.attributes[secondaryAttribute])
        console.log(attributeDefinitions[secondaryAttribute])
        if (attributeDefinitions[secondaryAttribute].is_required == 1 && typeof payload.attributes[secondaryAttribute] === 'undefined') {
          console.log('required attribute ' + secondaryAttribute + ' was not supplied')
          errors.push('required attribute ' + secondaryAttribute + ' was not supplied')
          foundErrors = true
          break
        }
      }

      for (secondaryAttribute in payload.attributes) {
        console.log('*** ' + secondaryAttribute)
        console.log(payload.attributes[secondaryAttribute])
        console.log(attributeDefinitions[secondaryAttribute])
        if (typeof attributeDefinitions[secondaryAttribute] === 'undefined') {
          console.log('unknown attribute ' + secondaryAttribute)
          errors.push('unknown attribute: ' + secondaryAttribute)
          foundErrors = true
        } else if (attributeDefinitions[secondaryAttribute].is_required == 1 && typeof payload.attributes[secondaryAttribute] === 'undefined') {
          console.log('required attribute ' + secondaryAttribute + ' was not supplied')
          errors.push('required attribute ' + secondaryAttribute + ' was not supplied')
          foundErrors = true

        // TODO: type validation and other rules...
      } else if (attributeDefinitions[secondaryAttribute].field_definition.type=='array' && !Array.isArray(payload.attributes[secondaryAttribute])){
        errors.push('array attribute ' + secondaryAttribute + ' was not an array')
        foundErrors = true

        } else {
          searchKey += '|' + payload.attributes[secondaryAttribute]
          console.log('validation passed for ' + secondaryAttribute)
        }
      }
      if (!foundErrors) {
      // 4. insert main row

        console.log('*****')
        console.log(JSON.stringify(payload))

        query = `
        INSERT INTO licence
        (licence_org_id,licence_type_id,licence_ref,licence_status_id,licence_search_key,licence_start_dt,licence_end_dt)
        VALUES
        ($1,$2,$3,$4,$5,to_date($6::text,'YYYY/MM/DD'),to_date($7::text,'YYYY/MM/DD'))
        RETURNING licence_id`
        var queryParams = [payload.licence_org_id, payload.licence_type_id, payload.licence_ref, 1, searchKey,payload.licence_start_dt,payload.licence_end_dt]
        console.log(queryParams)
        client.query(query, queryParams, (err, res) => {
          if (err) {
            console.log(err ? err.stack : res.rows[0])
            client.end()
            reject(err)
          } else {
            var licence_id = res.rows[0].licence_id
            console.log('no db error')

            var queryParams = []
            var query = ''
            console.log('--------------')
            console.log(attributeDefinitions)
            for (secondaryAttribute in payload.attributes) {
              console.log(secondaryAttribute)
              console.log('inserted as')
              console.log(payload.attributes[secondaryAttribute])
              query += 'insert into licence_data values '
              query += '(' + licence_id + ',\'' + JSON.stringify(payload.attributes[secondaryAttribute]) + '\',' + attributeDefinitions[secondaryAttribute].type_fields_id + ');'
//                counter++;
//                queryParams.push(returnedAttributeDefinition[attribute].type_fields_id);
//                query+='$'+counter+') ;'
            }

            console.log(query)
            queryParams = []
            /**
            insert into licence_data values (1,1), (1,2), (1,3), (2,1);

            for(secondaryAttribute in payload.attributes){
              if (typeof attributeDefinitions[secondaryAttribute] == 'undefined'){
                console.log('unknown attribute '+secondaryAttribute)
                reject('unknown attribute: '+secondaryAttribute)
                foundErrors=true
                break
                //TODO: type validation and other rules...
              } else {
                searchKey+='|'+payload.attributes[secondaryAttribute]
                console.log('validation passed for '+secondaryAttribute)
              }
            **/

            client.query(query, queryParams, (err, res) => {
              if (err) {
                console.log(err ? err.stack : res.rows[0])
                reject(err)
              } else {
                console.log('no db error')
                cb(licence_id)
                client.end()
              }
            })
          }
        })
      // 5. insert attributes:
      // licence_id, licence_data_value, type_fields_id,
      } else {
        reject(errors)
      }
    })
  }
}

function updateLicence(cb){

}

function deleteLicence(cb){

}

function getLicenceFields(request,cb) {
  const client = new Client()
  client.connect()
  client.query('SELECT tf.*,f.field_nm from type_fields tf join field f on tf.field_id=f.field_id where type_id=$1', [request.params.typeId], (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })
}

function reset(cb){

  const client = new Client()
  client.connect()
  client.query('truncate licence; truncate licence_data', [], (err, res) => {
    if(err){
      console.log(err ? err.stack : res.rows[0]) // Hello World!
      client.end()
      cb(err)
    } else {
      console.log('data reset and reloaded');
      client.end()
      cb({'message':'data reset and reloaded'})
    }

  })


}

module.exports = {
  field:{
    list:getFields
  },
  org:{
    list:getOrgs,
    get:getOrg,
    create:createOrg,
    update:updateOrg,
    delete:deleteOrg,
  },
  type:{
    list:getTypes,
    get:getType,
    create:createType,
    update:updateType,
    delete:deleteType,
  },
  licence:{
    list:getLicences,
    get:getLicence,
    create:createLicence,
    update:updateLicence,
    delete:deleteLicence,

  },
  licencefield:{
    list:getLicenceFields
  },
  reset:reset

}

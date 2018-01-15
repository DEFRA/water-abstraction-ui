/**
 * Provides convenience methods for HTTP API requests from the tactical CRM
 * @module lib/connectors/crm
 */
const rp = require('request-promise-native').defaults({
    proxy:null,
    strictSSL :false
  });
const moment = require('moment');


/**
 * Enter verification code
 * @param {String} entity_id - the individual's entity ID
 * @param {String} company_entity_id - the company entity ID to verify licences for
 * @param {String} verification_code - the verification code supplied by the user
 * @return {Promise} - resolves with verification records if found
 */
function checkVerification(entity_id, company_entity_id, verification_code) {
  const uri = process.env.CRM_URI + '/verification';
  return rp({
    method: 'GET',
    uri,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    qs : {
      filter : JSON.stringify({
        entity_id,
        company_entity_id,
        verification_code
      })
    },
    json : true
  });
}


/**
 * Enter verification code
 * @param {String} entity_id - the individual's entity ID
 * @param {String} company_entity_id - the company entity ID to verify licences for
 * @param {String} verification_code - the verification code supplied by the user
 * @return {Promise} - resolves if code OK
 */
function completeVerification(verification_id) {
  var uri = process.env.CRM_URI + '/verification/' + verification_id;
  return rp({
    method: 'PATCH',
    uri,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    body: {
      date_verified : moment().format()
    },
    json : true
  });
}


/**
 * Create verification
 * @param {String} entity_id - the individual's entity ID
 * @param {String} company_entity_id - the company entity ID to verify licences for
 * @param {String} [method] - the verification method, e.g. post|phone
 * @return {Promise} resolves with user entity record
 */
function createVerification(entity_id, company_entity_id, method = 'post') {
  const uri = process.env.CRM_URI + '/verification';
  return rp({
    uri,
    method : 'POST',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    body : {
      entity_id,
      company_entity_id,
      method
    },
    json : true
  });
}

/**
 * Get outstanding verifications for user
 * @param {String} entity_id - the individual's entity ID
 * @return {Promise} resolves with list of verifications that haven't been completed
 */
function getOutstandingVerifications(entity_id) {
  const uri = process.env.CRM_URI + '/verification';
  const filter = JSON.stringify({
    entity_id,
    date_verified : null
  });
  return rp({
    uri,
    method : 'GET',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    qs : {
      filter
    },
    json : true
  });
}

/**
 * Bulk update document headers
 * @param {Object} query - find the documents to update
 * @param {Object} set - specifies the fields to update
 * @return {Promise}
 * @example updateDocumentHeaders({query : document_id : ['123', '456']}, {verification_id : 'xyx'})
 */
function updateDocumentHeaders(query, set) {
  var uri = process.env.CRM_URI + '/documentHeader';
  return rp({
    uri,
    method : 'PATCH',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    qs : {
      filter : JSON.stringify(query)
    },
    body : set,
    json : true
  });
}


/**
 * Create entity record
 * @param {String} entity_nm - entity name - the user's email address
 * @param {String} [entity_type] - entity type, individual|company etc.
 * @return {Promise} resolves with user entity record
 */
function createEntity(entity_nm, entity_type = 'individual') {
  var uri = process.env.CRM_URI + '/entity';
  return rp({
    uri,
    method : 'POST',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    body : {
      entity_nm,
      entity_type
    },
    json : true
  });
}

/**
 * Add entity role
 * Allows an entity to access a certain company
 * @param {String} entity_id - the individual entity being granted access
 * @param {String} company_entity_id - the company entity ID the individual is being granted access to
 * @param {String} role - the role can be user|agent|admin
 * @param {Boolean} is_primary - whether primary user for company
 * @return {Promise} resolves with role created on success
 */
function addEntityRole(entity_id, company_entity_id, role, is_primary = false) {
  var uri = process.env.CRM_URI + '/entity/' + entity_id + '/roles';
  return rp({
    uri,
    method : 'POST',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    body : {
      company : company_entity_id,
      role,
      is_primary : is_primary ? 1 : 0
    },
    json : true
  });
}



/**
 * Get entity record
 * @param {String} user_name - the email address of the current user
 * @return {Promise} resolves with user entity record
 * @example getEntity('mail@example.com').then((response) => { // response.data });
 */
function getEntity(user_name) {
  var uri = process.env.CRM_URI + '/entity/' + user_name + '?token=' + process.env.JWT_TOKEN
  return rp({
    uri,
    method : 'GET',
    json : true
  });
}

/**
 * Get entity roles
 * @param {String} entityId - the user's individual entity ID
 * @return {Promise} resolves with found roles
 */
function getEntityRoles(entityId) {
  const uri = process.env.CRM_URI + '/entity/' + entityId + '/roles';
  return rp({
    uri,
    method : 'GET',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    json : true
  });
}

/**
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence lisrt
 * @param {String} [filter.entity_id] - the current user's entity ID
 * @param {String} [filter.email] - the email address to search on
 * @param {String} [filter.string] - the search query, can be licence number, user-defined name etc.
 * @param {Object} [sort] - fields to sort on
 * @param {Number} [sort.licenceNumber] - sort on licence number, +1 : asc, -1 : desc
 * @param {Number} [sort.name] - sort on licence name, +1 : asc, -1 : desc
 * @param {Boolean} [roleFilter] - whether to include roll filtering (true) or search raw licence data (false)
 * @return {Promise} resolves with array of licence records
 * @example getLicences({entity_id : 'guid'})
 */
function getLicences(filter, sort = {}, roleFilter = true) {

  if(roleFilter) {
    const uri = process.env.CRM_URI + '/documentHeader/filter';
    return rp({
      uri,
      method : 'POST',
      headers : {
        Authorization : process.env.JWT_TOKEN
      },
      json : true,
      body : { filter, sort }
    });
  }
  else {
    const uri = process.env.CRM_URI + '/documentHeader';

    // Format query params
    const qs = {};
    if(filter) {
      qs.filter = JSON.stringify(filter);
    };
    if(sort) {
      qs.sort =  JSON.stringify(sort);
    }

    return rp({
      uri,
      method : 'GET',
      headers : {
        Authorization : process.env.JWT_TOKEN
      },
      json : true,
      qs
    });
  }
}


/**
 * Get a licence by document ID
 * @param {String} documentId - the GUID for the licence document header
 * @return {Promise} resolves with licence if found
 */
function getLicence(documentId) {

  const uri = process.env.CRM_URI + '/documentHeader/' + documentId;
  return rp({
    uri,
    method : 'GET',
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    json : true
  });
}

/**
 * Set licence name
 * @param {String} documentId - the CRM document ID identifying the permit
 * @param {String} name - the user-defined document name
 * @return {Promise} resolves when name updated
 */
function setLicenceName(documentId, name) {
  const uri = process.env.CRM_URI + '/documentHeader/' + documentId + '/entity/0/name?token=' + process.env.JWT_TOKEN;
  return rp({
    uri,
    method : 'POST',
    json : true,
    body : { name }
  });
}



function getLicenceInternalID(licences, document_id) {
  /**this function gets the internal ID (i.e. the ID of the licence in the permit repository) from the document_id
  (from the CRM document header record) which can then be used to retrieve the full licence from the repo **/
  return new Promise((resolve, reject) => {
    var thisLicence = licences.find(x => x.document_id === document_id)
    if (thisLicence) {
      resolve(thisLicence)
    } else {
      reject('Licence with ID ' + document_id + ' could not be found.')
    }
  })
}


async function getEditableRoles(entity_id,sort,direction) {
  ///entity/{entity_id}/colleagues
  const uri=process.env.CRM_URI + '/entity/' + entity_id + '/colleagues?sort='+sort+'&direction='+direction+'&token=' + process.env.JWT_TOKEN
  console.log(uri)
  const options = {
        method: `GET`,
        uri: uri
      };
      try {
        const response = await rp(options);
        return Promise.resolve(response);
      }
      catch (error) {
        Promise.reject(error);
      }
}

async function deleteColleagueRole(entity_id,entity_role_id) {
  const uri=process.env.CRM_URI + '/entity/' + entity_id + '/colleagues/'+entity_role_id+'?token=' + process.env.JWT_TOKEN
  const options = {
        method: `DELETE`,
        uri: uri
      };
      try {
        const response = await rp(options);
        return Promise.resolve(response);
      }
      catch (error) {
        Promise.reject(error);
      }
}

async function addColleagueRole(entity_id,email) {

  const uri=process.env.CRM_URI + '/entity/' + entity_id + '/colleagues/?token=' + process.env.JWT_TOKEN
  var data={email:email}
  const options = {
        method: `POST`,
        uri: uri,
        json : true,
        body : data
      };
      try {
        const response = await rp(options);
        return Promise.resolve(response);
      }
      catch (error) {
        console.log(error)
        return Promise.reject(error);
      }
}


/**
 * Gets or creates an individual entity for an individual
 * with the supplied email address
 * @param {String} emailAddress
 * @return {Promise} resolves with entity ID
 */
async function getOrCreateIndividualEntity(emailAddress) {

  const entity_nm = emailAddress.toLowerCase().trim();

  // Get existing entity
  // @todo this should check for company entity type
  const {error, data} = await getEntity(entity_nm);

  // CRM error
  if(error) {
    throw error;
  }

  // Entity was found
  if(data && data.entity && data.entity.entity_id) {
    console.log(`Existing CRM entity ${ data.entity.entity_id }`);
    return data.entity.entity_id;
  }

  // Create new entity
  const res = await createEntity(emailAddress.toLowerCase().trim(), 'individual');
  if(res.error) {
    throw res.error;
  }
  console.log(`Created CRM entity ${ res.data.entity_id }`);
  return res.data.entity_id;
}

module.exports = {
  getEntity,
  getEntityRoles,
  addEntityRole,
  createEntity,
  getLicence,
  getLicences,
  getLicenceInternalID,
  setLicenceName,
  getEditableRoles,
  deleteColleagueRole,
  addColleagueRole,
  createVerification,
  checkVerification,
  getOutstandingVerifications,
  completeVerification,
  updateDocumentHeaders,
  getOrCreateIndividualEntity
}

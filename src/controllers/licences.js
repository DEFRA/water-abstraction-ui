/**
 * HAPI Route handlers for viewing and managing licences
 * @module controllers/licences
 */
const Boom = require('boom');
const BaseJoi = require('joi');

const CRM = require('../lib/connectors/crm');
const IDM = require('../lib/connectors/idm');
const Notify = require('../lib/connectors/notify');
const View = require('../lib/view');
const Permit = require('../lib/connectors/permit');
const errorHandler = require('../lib/error-handler');
const LicenceTransformer = require('../lib/licence-transformer/');


const {licenceRoles, licenceCount, licenceConditions} = require('../lib/licence-helpers');
const Joi = require('joi');

/**
 * Gets a list of licences with options to filter by email address,
 * Search by licence number, and sort by number/user defined name
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.emailAddress] - the email address to filter on
 * @param {String} [request.query.licenceNumber] - the licence number to search on
 * @param {String} [request.query.sort] - the field to sort on licenceNumber|name
 * @param {Number} [request.query.direction] - sort direction +1 : asc, -1 : desc
 * @param {Object} reply - the HAPI HTTP response
 */
async function getLicences(request, reply) {

  const viewContext = View.contextDefaults(request);

  const { entity_id } = request.auth.credentials;

  // Get filtered list of licences
  const filter = {
    entity_id,
    string : request.query.licenceNumber,
    email : request.query.emailAddress
  };

  // Sorting
  const sortFields= {licenceNumber : 'system_external_id', name : 'document_custom_name'};
  const sortField = request.query.sort || 'licenceNumber';
  const direction = request.query.direction === -1 ? -1 : 1;
  const sort = {};
  sort[sortFields[sortField]] = direction;

  // Set sort info on viewContext
  viewContext.direction = direction;
  viewContext.sort = sortField;

  // Validate email address
  const schema = {
    emailAddress : Joi.string().allow('').email(),
    licenceNumber : Joi.string().allow(''),
    sort : Joi.string().allow(''),
    direction : Joi.number()
  };
  const {error, value} = Joi.validate(request.query, schema);
  if(error) {
    viewContext.error = error;
  }

  try {

    // Look up user for email filter
    if(value.emailAddress && !error) {
      try {
          const user = await IDM.getUser(value.emailAddress);
      }
      catch(error) {
        // User not found
        if(error.statusCode === 404) {
            viewContext.error = error;
        }
        else {
          throw error;
        }
      }
    }

    // Lookup licences
    const { data, err, summary } = await CRM.documents.getLicences(filter, sort);

    if(err) {
      throw Boom.badImplementation('CRM error', response);
    }

    // Does user have no licences to view?
    if(data.length < 1 && !filter.string && !filter.email) {
      // Does user have outstanding verification codes?
      const { data : verifications, error } = await CRM.verification.findMany({entity_id, date_verified : null});
      if(error) {
        throw error;
      }
      if(verifications.length > 0) {
        return reply.redirect('/security-code');
      }
      else {
        return reply.redirect('/add-licences');
      }
    }

    // Render HTML page
    viewContext.licenceData = data
    viewContext.debug.licenceData = data
    viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'

    viewContext.me=request.auth.credentials

    // Calculate whether to display email filter / search form depending on summary
    const userRoles = licenceRoles(summary);

    viewContext.licenceCount = licenceCount(summary);
    viewContext.showEmailFilter = userRoles.admin || userRoles.agent;
    viewContext.showManageFilter = userRoles.primary_user;
    if(userRoles.admin || userRoles.agent || userRoles.user){
      viewContext.showManageFilter=false
    }
    viewContext.enableSearch = viewContext.licenceCount  > 5; // @TODO confirm with design team

    return reply.view('water/licences', viewContext)

  }
  catch(error) {
    errorHandler(request, reply)(error);
  }

}


/**
 * Renders a licence page with one of several different views
 * @param {String} view - the template to load
 * @param {String} pageTitle - custom page title for this view
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
async function renderLicencePage(view, pageTitle, request, reply, context = {}) {

  const { entity_id } = request.auth.credentials;

  const viewContext = Object.assign({}, View.contextDefaults(request), context);

  viewContext.pageTitle = pageTitle

  // Get filtered list of licences
  const filter = {
    entity_id,
    document_id : request.params.licence_id
  };

  try {

    // Get CRM data
    const response = await CRM.documents.getLicences(filter);
    if(response.error) {
      throw Boom.badImplementation(`CRM error`, response);
    }
    if(response.data.length != 1) {
      throw new Boom.notFound('Document not found in CRM', response);
    }
    viewContext.crmData = response.data[0];

    // Get permit repo data
    const {error : permitError, data : permitData} = await Permit.licences.findOne(response.data[0].system_internal_id);

    if(permitError) {
      throw permitError;
    }

    const data = JSON.parse(permitData.licence_data_value);

    require('fs').writeFileSync('../nald-licence.json', JSON.stringify(data, null, 2));


    const transformer = new LicenceTransformer();
    await transformer.load(data);
    console.log('EXPORT', transformer.export());
    // console.log(transformer);



    viewContext.licence_id = request.params.licence_id;
    viewContext.licenceData = transformer.export();
    viewContext.debug.licenceData = data;
    viewContext.name = 'name' in viewContext ? viewContext.name : viewContext.crmData.document_custom_name;
    // viewContext.conditions = await licenceConditions(data);

    console.log(JSON.stringify(viewContext.licenceData, null, 2));

    return reply.view(view, viewContext)

  }
  catch(error) {
    errorHandler(request, reply)(error);
  }
}

function getLicence(request, reply) {

  renderLicencePage(
    'water/licence', 'GOV.UK - Your water abstraction licences', request, reply
  )
}

function getLicenceContact(request, reply) {
  renderLicencePage(
    'water/licences_contact', 'GOV.UK - Your water abstraction licences - contact details', request, reply
  )
}

function getLicenceMap(request, reply) {
  renderLicencePage(
    'water/licences_map', 'GOV.UK - Your water abstraction licences - Map', request, reply
  )
}

function getLicenceTerms(request, reply) {
  renderLicencePage(
    'water/licences_terms', 'GOV.UK - Your water abstraction licences - Full Terms', request, reply
  )
}

function getLicenceRename(request, reply, context = {}) {
  renderLicencePage(
    'water/licences_rename', 'GOV.UK - Your water abstraction licences - Rename', request, reply, context
  )
}

function getLicenceConditions(request, reply, context = {}) {
  renderLicencePage(
    'water/licences_conditions', 'GOV.UK - Your water abstraction licences - conditions', request, reply, context
  )
}

/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
function postLicence(request, reply) {

  const { name } = request.payload;
  const { entity_id } = request.auth.credentials;

  // Prepare filter for filtering licence list from CRM
  const filter = {
    entity_id,
    document_id : request.params.licence_id
  };

  // Validate supplied licence name
  const schema = {
    name : Joi.string().trim().required().min(2).max(32).regex(/^[a-z0-9 ']+$/i)
  };
  const {error, value} = Joi.validate({name}, schema, {abortEarly : false});
  if(error) {
      return getLicenceRename(request, reply, {error, name : request.payload.name });
  }

  CRM.documents.getLicences(filter)
    .then((response) => {

      if(!response || response.err) {
        throw new Boom.badImplementation('CRM error', response);
      }

      if(response.data.length !== 1) {
        throw new Boom.notFound('Document not found in CRM');
      }

      // Get the document ID from the returned CRM data
      const { document_id, system_internal_id } = response.data[0];

      // Udpate licence name in CRM
      return CRM.documents.setLicenceName(document_id, value.name);
    })
    .then((response) => {
      // Licence updated - redirect to licence view
      reply.redirect(`/licences/${ request.params.licence_id }`);
    })
    .catch(errorHandler(request, reply));

}


/**
 * Renders list of emails with access to your licences
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */


async function getAccessList(request, reply, context = {}) {
  const { entity_id } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  // Sorting
  const sortFields= {entity_nm : 'entity_nm', created_at : 'created_at'};
  const sortField = request.query.sort || 'entity_nm';
  const direction = request.query.direction === -1 ? -1 : 1;
  const sort = {};
  sort[sortFields[sortField]] = direction;

  // Set sort info on viewContext
  viewContext.direction = direction;
  viewContext.sort = sortField;



  viewContext.pageTitle = "Manage access to your licences"
  viewContext.entity_id=entity_id
  //get list of role  s in same org as current user
  //need to ensure that current user is admin...


  const licenceAccess = await CRM.entityRoles.getEditableRoles(entity_id,sortField,direction)
  viewContext.licenceAccess=JSON.parse(licenceAccess)
  return reply.view('water/manage_licences', viewContext)
}



/**
 * Renders form for user to share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
function getAddAccess(request, reply, context = {}) {
  const { entity_id } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.pageTitle = "Manage access to your licences"
  //get list of roles in same org as current user
  return reply.view('water/manage_licences_add_access_form', viewContext)
}

/**
 * share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {string} email - the email of account to share with
 * @param {Object} [context] - additional view context data
 */
function postAddAccess(request, reply, context = {}) {


  const { entity_id } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.pageTitle = "Manage access to your licences"
  viewContext.email=request.payload.email
  viewContext.errors={}
  // Validate input data with Joi
  const schema = {
    email : Joi.string().trim().required().email()
  };

  Joi.validate(request.payload, schema, function (err, value) {
  // Value is the parsed and validated document.
  if (err) {
    // Gracefully handle any errors.
    viewContext.errors.email=true
    return reply.view('water/manage_licences_add_access_form', viewContext)
  } else {


    IDM.createUserWithoutPassword(request.payload.email)
    .then((response) => {
        console.log('*** createUserWithoutPassword *** '+request.payload.email)
      if(response.error) {
        notified=Notify.sendAccesseNotification({newUser:false,email:request.payload.email,sender:request.auth.credentials.username})
        .then((d)=>{
          console.log(d)
        }).catch((e)=>{
          console.log(e)
        })
        //send notify email!!!
  //      throw Boom.badImplementation('IDM error', response.error);
      } else {
        notified=Notify.sendAccesseNotification({newUser:true,email:request.payload.email,sender:request.auth.credentials.username})      .then((d)=>{
                console.log(d)
              }).catch((e)=>{
                console.log(e)
              })


      }

    })
    .then(() => {
        console.log('*** createEntity *** '+request.payload.email)
      // Create CRM entity
      //return CRM.createEntity(request.payload.email);
      // Can't rely on POST as duplicates are now allowed
      return CRM.entities.getOrCreateIndividual(request.payload.email);
    }).then(async ()=>{
        console.log('add role')
        const licenceAccess = await CRM.entityRoles.addColleagueRole(entity_id,request.payload.email)
        return reply.view('water/manage_licences_added_access', viewContext)
    })



  }
});



}

/**
 * unshare a licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
async function getRemoveAccess(request, reply, context = {}) {

  const { entity_id } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.email=request.query.email
  const licenceAccess = await CRM.entitytRoles.deleteColleagueRole(entity_id,request.query.entity_role_id)
  console.log('viewContext ',viewContext)
  viewContext.pageTitle = "Manage access to your licences"
  //get list of roles in same org as current user
  //call CRM and add role. CRM will call IDM if account does not exist...
  return reply.view('water/manage_licences_removed_access', viewContext)


}



module.exports = {
  getLicences,
  getLicence,
  postLicence,
  getLicenceContact,
  getLicenceMap,
  getLicenceTerms,
  getLicenceRename,
  getLicenceConditions,
  getAccessList,
  getAddAccess,
  postAddAccess,
  getRemoveAccess

};

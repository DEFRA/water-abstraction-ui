const Joi = require('joi');
const Notify = require('../lib/connectors/notify');
const View = require('../lib/view');
const CRM = require('../lib/connectors/crm');
const IDM = require('../lib/connectors/idm');
const errorHandler = require('../lib/error-handler');

/**
 * Renders list of emails with access to your licences
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */

async function getAccessList (request, reply, context = {}) {
  const { entity_id: entityId } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.activeNavLink = 'manage';

  // Sorting
  const sortFields = {entity_nm: 'entity_nm', created_at: 'created_at'};
  const sortField = request.query.sort || 'entity_nm';
  const direction = request.query.direction === -1 ? -1 : 1;
  const sort = {};
  sort[sortFields[sortField]] = direction;

  // Set sort info on viewContext
  viewContext.direction = direction;
  viewContext.sort = sortField;

  viewContext.pageTitle = 'Manage access to your licences';
  viewContext.entity_id = entityId;
  // get list of role  s in same org as current user
  // need to ensure that current user is admin...

  const licenceAccess = await CRM.entityRoles.getEditableRoles(entityId, sortField, direction);
  viewContext.licenceAccess = JSON.parse(licenceAccess);
  return reply.view('water/manage_licences', viewContext);
}

/**
 * Renders form for user to share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
function getAddAccess (request, reply, context = {}) {
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.activeNavLink = 'manage';
  viewContext.pageTitle = 'Manage access to your licences';
  // get list of roles in same org as current user
  return reply.view('water/manage_licences_add_access_form', viewContext);
}

/**
 * share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {string} email - the email of account to share with
 * @param {Object} [context] - additional view context data
 */
function postAddAccess (request, reply, context = {}) {
  const { entity_id: entityId } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.activeNavLink = 'manage';
  viewContext.pageTitle = 'Manage access to your licences';
  viewContext.email = request.payload.email;
  viewContext.errors = {};
  // Validate input data with Joi
  const schema = {
    email: Joi.string().trim().required().email()
  };

  Joi.validate(request.payload, schema, function (err, value) {
  // Value is the parsed and validated document.
    if (err) {
    // Gracefully handle any errors.
      viewContext.errors.email = true;
      return reply.view('water/manage_licences_add_access_form', viewContext);
    } else {
      IDM.createUserWithoutPassword(request.payload.email)
        .then((response) => {
          console.log('*** createUserWithoutPassword *** ' + request.payload.email);
          if (response.error) {
            Notify.sendAccesseNotification({newUser: false, email: request.payload.email, sender: request.auth.credentials.username})
              .then((d) => {
                console.log(d);
              }).catch((e) => {
                console.log(e);
              });
          } else {
            Notify.sendAccesseNotification({newUser: true, email: request.payload.email, sender: request.auth.credentials.username}).then((d) => {
              console.log(d);
            }).catch((e) => {
              console.log(e);
            });
          }
        })
        .then(() => {
          console.log('*** createEntity *** ' + request.payload.email);
          // Create CRM entity
          // return CRM.createEntity(request.payload.email);
          // Can't rely on POST as duplicates are now allowed
          return CRM.entities.getOrCreateIndividual(request.payload.email);
        }).then(async () => {
          console.log('add role');
          await CRM.entityRoles.addColleagueRole(entityId, request.payload.email);
          return reply.view('water/manage_licences_added_access', viewContext);
        });
    }
  });
}

/**
 * unshare a licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
async function getRemoveAccess (request, reply, context = {}) {
  const { entity_id: entityId } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.activeNavLink = 'manage';
  viewContext.email = request.query.email;
  await CRM.entitytRoles.deleteColleagueRole(entityId, request.query.entity_role_id);
  console.log('viewContext ', viewContext);
  viewContext.pageTitle = 'Manage access to your licences';
  // get list of roles in same org as current user
  // call CRM and add role. CRM will call IDM if account does not exist...
  return reply.view('water/manage_licences_removed_access', viewContext);
}

/**
 * Instructions on how to add further licences to your account
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
async function getAddLicences (request, reply, context = {}) {
  const { entity_id: entityId } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.activeNavLink = 'manage';
  viewContext.pageTitle = 'Access more licences';

  try {
    // Does user have outstanding verification codes?
    const { data: verifications, error } = await CRM.verification.findMany({entity_id: entityId, date_verified: null});
    if (error) {
      throw error;
    }

    viewContext.verificationCount = verifications.length;
    return reply.view('water/manage_licences_add', viewContext);
  } catch (error) {
    errorHandler(request, reply)(error);
  }
}

module.exports = {
  getAccessList,
  getAddAccess,
  postAddAccess,
  getRemoveAccess,
  getAddLicences
};

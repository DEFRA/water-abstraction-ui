const Joi = require('joi');
const Notify = require('../../lib/connectors/notify');
const View = require('../../lib/view');
const CRM = require('../../lib/connectors/crm');
const IDM = require('../../lib/connectors/idm');
// const errorHandler = require('../../lib/error-handler');

/**
 * Index page for manage licences
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
async function getManage (request, reply) {
  const { view } = request;
  return reply.view('water/manage-licences/manage_licences', view);
}

/**
 * Takes the response from the query to get all colleague roles
 * and changes the shape of the data to be more friendy for rendering.
 *
 * Also updates a user role a flag showing if that user also has returns
 * priviledges
 */
const createAccessListViewModel = licenceAccess => {
  const userRoles = licenceAccess.filter(r => r.role === 'user');
  const mapped = userRoles.map(ur => {
    return {
      createdAt: ur.created_at,
      hasReturns: !!licenceAccess.find(la => {
        return (
          la.company_entity_id === ur.company_entity_id &&
          la.regime_entity_id === ur.regime_entity_id &&
          la.individual_entity_id === ur.individual_entity_id &&
          la.role === 'user_returns'
        );
      }),
      name: ur.entity_nm,
      id: ur.entity_role_id,
      colleagueEntityID: ur.individual_entity_id
    };
  });
  return mapped;
};

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
  const sortFields = { entity_nm: 'entity_nm', created_at: 'created_at' };
  const sortField = request.query.sort || 'entity_nm';
  const direction = request.query.direction === -1 ? -1 : 1;
  const sort = {};
  sort[sortFields[sortField]] = direction;

  // Set sort info on viewContext
  viewContext.direction = direction;
  viewContext.sort = sortField;

  viewContext.pageTitle = 'Give access to your licences';
  viewContext.entity_id = entityId;
  // get list of role  s in same org as current user
  // need to ensure that current user is admin...

  const licenceAccess = await CRM.entityRoles.getEditableRoles(entityId, sortField, direction);
  viewContext.licenceAccess = createAccessListViewModel(JSON.parse(licenceAccess));
  return reply.view('water/manage-licences/manage_licences_access', viewContext);
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
  viewContext.pageTitle = 'Give access to view your licences';

  // get list of roles in same org as current user
  return reply.view('water/manage-licences/manage_licences_add_access_form', viewContext);
}

/**
 * share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {string} email - the email of account to share with
 * @param {Object} [context] - additional view context data
 */
async function postAddAccess (request, reply, context = {}) {
  const { entity_id: entityId } = request.auth.credentials;
  const viewContext = Object.assign({}, View.contextDefaults(request), context);
  viewContext.activeNavLink = 'manage';
  viewContext.pageTitle = 'Manage access to your licences';
  viewContext.email = request.payload.email;
  viewContext.errors = {};
  // Validate input data with Joi
  const schema = {
    email: Joi.string().trim().required().email().lowercase().trim(),
    returns: Joi.boolean(),
    csrf_token: Joi.string().guid().required()
  };

  // Process:
  // 1. Attempt to create IDM user
  // 2. If new user, generate reset GUID URL to create password flow
  // 3. Send new / existing access notification (new user requires reset GUID)
  // 4. Get/create CRM entity
  // 5. Add colleague role

  try {
    const { error: validationError, value } = Joi.validate(request.payload, schema);

    // Gracefully handle any errors.
    if (validationError) {
      viewContext.errors.email = true;
      return reply.view('water/manage-licences/manage_licences_add_access_form', viewContext);
    }

    // Notification details
    const { username: sender } = request.auth.credentials;
    const { email, returns: allowReturns } = value;

    const { error: createUserError } = await IDM.createUserWithoutPassword(email);

    // User exists
    if (createUserError) {
      const { error: notifyError } = Notify.sendAccesseNotification({ newUser: false, email, sender });
      if (notifyError) {
        throw notifyError;
      }
    } else {
      // New user - reset password
      const { error: resetError } = await IDM.resetPassword(request.payload.email, 'sharing', { sender });
      if (resetError) {
        throw resetError;
      }
    }

    // Create CRM entity for invited user
    const crmEntityId = await CRM.entities.getOrCreateIndividual(email);

    // Add role
    const userRoleResponse = await CRM.entityRoles.addColleagueRole(entityId, crmEntityId);

    if (userRoleResponse.error) {
      throw userRoleResponse.error;
    }

    if (allowReturns) {
      const userReturnsRoleResponse = await CRM.entityRoles.addColleagueRole(entityId, crmEntityId, 'user_returns');

      if (userReturnsRoleResponse.error) {
        throw userReturnsRoleResponse.error;
      }
    }

    // Update the idm.user with the crm.entity id
    const { data: user } = await IDM.getUserByEmail(email);
    await IDM.updateExternalId(user, crmEntityId);

    return reply.view('water/manage-licences/manage_licences_added_access', viewContext);
  } catch (err) {
    reply(err);
  }
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
  await CRM.entityRoles.deleteColleagueRole(entityId, request.query.entity_role_id);
  console.log('viewContext ', viewContext);
  viewContext.pageTitle = 'Manage access to your licences';
  // get list of roles in same org as current user
  // call CRM and add role. CRM will call IDM if account does not exist...
  return reply.view('water/manage-licences/manage_licences_removed_access', viewContext);
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
  viewContext.pageTitle = 'Manage your licences';

  try {
    // Does user have outstanding verification codes?
    const { data: verifications, error } = await CRM.verification.findMany({ entity_id: entityId, date_verified: null });
    if (error) {
      throw error;
    }

    viewContext.verificationCount = verifications.length;
    return reply.view('water/manage-licences/manage_licences_add', viewContext);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getManage,
  getAccessList,
  getAddAccess,
  postAddAccess,
  getRemoveAccess,
  getAddLicences,
  createAccessListViewModel
};

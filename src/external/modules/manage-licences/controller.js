const Joi = require('joi');
const Boom = require('boom');
const { find } = require('lodash');
const { logger } = require('../../logger');
const services = require('../../lib/connectors/services');
const config = require('../../config');

/**
 * Index page for manage licences
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI HTTP response
 */
async function getManageLicences (request, h) {
  return h.view('nunjucks/manage-licences/index.njk', request.view, {
    layout: false
  });
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
    const returnsRole = licenceAccess.find(la => {
      return (
        la.company_entity_id === ur.company_entity_id &&
        la.regime_entity_id === ur.regime_entity_id &&
        la.individual_entity_id === ur.individual_entity_id &&
        la.role === 'user_returns'
      );
    });

    return {
      createdAt: ur.created_at,
      hasReturns: !!returnsRole,
      returnsEntityRoleID: returnsRole ? returnsRole.entity_role_id : void 0,
      name: ur.entity_nm,
      id: ur.entity_role_id,
      colleagueEntityID: ur.individual_entity_id
    };
  });
  return mapped;
};

const getLicenceAccessListViewModel = async userEntityID => {
  const licenceAccess = await services.crm.entityRoles.getEditableRoles(userEntityID);
  return createAccessListViewModel(licenceAccess);
};

/**
 * Renders list of emails with access to your licences
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */

async function getAccessList (request, h, context = {}) {
  const { entityId } = request.defra;
  const viewContext = Object.assign(request.view, context);
  viewContext.entity_id = entityId;
  viewContext.licenceAccess = await getLicenceAccessListViewModel(entityId);
  return h.view('nunjucks/manage-licences/access-list.njk', viewContext, {
    layout: false
  });
}

/**
 * Renders form for user to share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI HTTP response toolkit
 * @param {Object} [context] - additional view context data
 */
function getAddAccess (request, h, context = {}) {
  return h.view(
    'nunjucks/manage-licences/add-access.njk',
    { ...request.view, ...context },
    { layout: false }
  );
}

/**
 * share their licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response toolkit
 * @param {string} email - the email of account to share with
 * @param {Object} [context] - additional view context data
 */
async function postAddAccess (request, h) {
  const { entityId } = request.defra;
  const viewContext = {
    ...request.view,
    email: request.payload.email,
    errors: {}
  };

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
      return getAddAccess(request, h, viewContext);
    }

    // Notification details
    const { userName: sender } = request.defra;
    const { email, returns: allowReturns } = value;
    const { application } = config.idm;

    const { error: createUserError } = await services.idm.users.createUserWithoutPassword(application, email);

    // User exists
    if (createUserError) {
      const { error: notifyError } = services.water.notifications.sendAccessNotification({ newUser: false, email, sender });
      if (notifyError) {
        throw notifyError;
      }
    } else {
      // New user - reset password
      const { error: resetError } = await services.idm.users.resetPassword(application, request.payload.email, 'sharing', { sender });
      if (resetError) {
        throw resetError;
      }
    }

    // Create CRM entity for invited user
    const { entity_id: crmEntityId } = await services.crm.entities.getOrCreateIndividual(email);

    // Add role
    const userRoleResponse = await services.crm.entityRoles.addColleagueRole(entityId, crmEntityId);

    if (userRoleResponse.error) {
      throw userRoleResponse.error;
    }

    if (allowReturns) {
      const userReturnsRoleResponse = await services.crm.entityRoles.addColleagueRole(entityId, crmEntityId, 'user_returns');

      if (userReturnsRoleResponse.error) {
        throw userReturnsRoleResponse.error;
      }
    }

    // Update the idm.user with the crm.entity id
    const user = await services.idm.users.findOneByEmail(email, config.idm.application);
    await services.idm.users.updateExternalId(user, crmEntityId);

    return h.view(
      'nunjucks/manage-licences/add-access-success.njk',
      viewContext,
      { layout: false }
    );
  } catch (err) {
    logger.errorWithJourney('Post add access error', err, request);
    throw err;
  }
}

/**
 * unshare a licence
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
async function getRemoveAccess (request, reply, context = {}) {
  const { entityId } = request.defra;
  const { colleagueEntityID } = request.params;

  try {
    const { data: colleagueEntity, error } = await services.crm.entities.findOne(colleagueEntityID);

    if (!colleagueEntity) {
      throw Boom.notFound(`Colleague ${colleagueEntityID} not found for ${entityId}`);
    }
    if (error) {
      throw Boom.badImplementation(`CRM error finding entity ${colleagueEntityID}`, error);
    }

    const viewContext = {
      ...request.view,
      ...context,
      colleagueName: colleagueEntity.entity_nm,
      colleagueEntityID
    };

    return reply.view(
      'nunjucks/manage-licences/remove-access.njk',
      viewContext,
      { layout: false }
    );
  } catch (error) {
    logger.errorWithJourney('Remove access error', error, request);
    throw error;
  }
}

/**
 * Removes colleague from company by deleting all roles
 * @param {String} regimeId - CRM entity GUID of regime
 * @param {String} companyId - CRM entity GUID of company
 * @param {String} entityId - CRM entity GUID of primary_user
 * @param {String} colleagueId - CRM entity GUID of colleague to remove
 * @return {Promise}
 */
const removeColleague = async (regimeId, companyId, entityId, colleagueId) => {
  // Find entity_roles for the colleague on this company
  const filter = {
    company_entity_id: companyId,
    ...regimeId && { regime_entity_id: regimeId }
  };

  const { data: roles, error: roleError } = await services.crm.entityRoles.setParams({ entityId: colleagueId }).findMany(filter);

  if (roleError) {
    throw Boom.badImplementation(`CRM error getting roles on company ${companyId} for entity ${colleagueId}`, roleError);
  }

  for (let role of roles) {
    services.crm.entityRoles.deleteColleagueRole(entityId, role.entity_role_id);
  }
};

/**
 * Removes colleague access to the primary user's company
 * @param {String} request.payload.colleagueEntityID - the entity ID of the colleague to remove
 */
async function postRemoveAccess (request, h) {
  const { entityId } = request.defra;
  const { colleagueEntityID } = request.payload;

  // Need to find all roles that the colleage has for the company
  // for whom the current user is the primary_user
  const { regime_entity_id: regimeId, company_entity_id: companyId } = find(request.defra.entityRoles, role => role.role === 'primary_user');

  await removeColleague(regimeId, companyId, entityId, colleagueEntityID);

  // Get the entity so their email can be displayed
  const { data: colleague, error } = await services.crm.entities.findOne(colleagueEntityID);

  if (error) {
    throw Boom.badImplementation(`CRM error`, error);
  }
  const view = {
    ...request.view,
    colleague
  };

  return h.view(
    'nunjucks/manage-licences/remove-access-success.njk',
    view,
    { layout: false }
  );
}

async function getChangeAccess (request, h) {
  const { entityId } = request.defra;
  const viewContext = request.view;

  const allAccessEntities = await getLicenceAccessListViewModel(entityId);
  const colleagueEntityRole = allAccessEntities.find(entity => entity.colleagueEntityID === request.params.colleagueEntityID);
  viewContext.colleagueEntityRole = colleagueEntityRole;

  return h.view(
    'nunjucks/manage-licences/change-access.njk',
    viewContext,
    { layout: false }
  );
};

async function postChangeAccess (request, h) {
  const { entityId } = request.defra;
  const { returns, colleagueEntityID, returnsEntityRoleID } = request.payload;

  if (returns && !returnsEntityRoleID) {
    await services.crm.entityRoles.addColleagueRole(entityId, colleagueEntityID, 'user_returns');
  }

  if (!returns && returnsEntityRoleID) {
    await services.crm.entityRoles.deleteColleagueRole(entityId, returnsEntityRoleID);
  }

  return h.redirect('/manage_licences/access');
};

exports.getManageLicences = getManageLicences;

exports.getAccessList = getAccessList;

exports.getAddAccess = getAddAccess;
exports.postAddAccess = postAddAccess;

exports.getRemoveAccess = getRemoveAccess;
exports.postRemoveAccess = postRemoveAccess;

exports.createAccessListViewModel = createAccessListViewModel;

exports.getChangeAccess = getChangeAccess;
exports.postChangeAccess = postChangeAccess;

/**
 * For hapi-auth-cookie authentication, the validateFunc validates the current
 * user and calculates credentials
 */
const { get } = require('lodash');
const idmConnector = require('./connectors/idm');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const entityRoles = require('./connectors/crm/entity-roles');

const getEntityRoles = async entityId => {
  const filter = {
    entity_id: entityId
  };
  const { error, data } = await entityRoles.findMany(filter);
  throwIfError(error);
  return data;
};

/**
 * Loads user data from IDM
 * @param {String} emailAddress
 * @return {Promise} resolves with row of IDM user data
 */
async function getIDMUser (email) {
  const { data: [user], error } = await idmConnector.getUserByEmail(email);

  throwIfError(error);

  if (!user) {
    throw new Error(`IDM user with email address ${email} not found`);
  }

  return user;
}

const getIDMScopes = user => get(user, 'role.scopes', []);

const getEntityId = user => get(user, 'external_id');

const getCompanyId = session => get(session, 'companyId');

const isExternalUser = user => getIDMScopes(user).includes('external');

/**
 * Gets an array of scopes for an external user based on their roles
 * @param  {Array} roles      - roles loaded from CRM entity_roles
 * @param  {String} companyId - company entity ID GUID
 * @return {Array}            - array of scopes
 */
const getExternalScopes = (roles, companyId) => {
  const companyRoles = roles.filter(role => role.company_entity_id === companyId);
  return companyRoles.map(role => role.role);
};

const createResponse = (valid, session, scope) => {
  return {
    valid,
    credentials: {
      ...session,
      scope
    }
  };
};

/**
 * @param  {[type]}  request [description]
 * @param  {[type]}  session [description]
 * @return {Promise}         [description]
 */
const validateFunc = async (request, session) => {
  // Is session username set?
  if (!session.username) {
    return createResponse(false);
  }

  // Get user from IDM
  const user = await getIDMUser(session.username);
  if (!user) {
    return createResponse(false);
  }

  // Initialise scopes to IDM scopes
  const scope = getIDMScopes(user);

  // For external users, load all roles
  if (isExternalUser(user)) {
    const entityId = getEntityId(user);
    const roles = await getEntityRoles(entityId);

    // Add scopes based on selected company
    const companyId = getCompanyId(session);
    if (companyId) {
      scope.push(getExternalScopes(roles, companyId));
    }
  };

  // console.log('validateFunc scope', scope);

  const response = createResponse(true, session, ['boo']);

  // console.log(response);
  return response;
};

module.exports = {
  validateFunc
};

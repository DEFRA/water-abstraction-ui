const { throwIfError } = require('@envage/hapi-pg-rest-api')
const { logger } = require('../logger')

const services = require('./connectors/services')
const getUserID = request => request.cookieAuth.get('userId')
const { isAuthenticated } = require('./permissions')

/**
 * Asynchronously loads user data from the water service, including their list
 * of companies
 * @param  {Object}  request - HAPI request
 * @return {Promise}         [description]
 */
const loadUserData = async userId => {
  const { data, error } = await services.water.users.getUserStatus(userId)
  throwIfError(error)
  return data
}

/**
 * Selects the company by setting the company name and ID in the session cookie
 * @param  {Object} request - the current HAPI request
 * @param  {Object} company - company details from water service endpoint
 */
const selectCompany = (request, company) => {
  request.yar.set('companyId', company.entityId)
  request.yar.set('companyName', company.name)
}

/**
 * Gets the path the user should be redirected to upon successful login
 * This depends on how many companies they manage
 */
const getLoginRedirectPath = async (request, user) => {
  const { user_id: userId } = user

  // Load companies to see how many they can access
  const data = await loadUserData(userId)

  // No companies - add licences
  if (data.companies.length > 1) {
    return '/select-company'
  }

  if (data.companies.length === 1) {
    // 1 Company, select company and direct to licences
    selectCompany(request, data.companies[0])
    return '/licences'
  }

  // For users with no company, add licences
  return '/add-licences'
}

/**
 * A pre-handler to redirect the user to the correct page if they attempt
 * to access the current page while authenticated
 * This for pages such as register, sign in etc.
 */
const preRedirectIfAuthenticated = async (request, h) => {
  if (isAuthenticated(request)) {
    const path = await getLoginRedirectPath(request, request.defra.user)
    if (path) {
      logger.info('Redirecting authenticated user', { from: request.path, path })
      return h.redirect(path).takeover()
    }
  }
  return h.continue
}

exports.loadUserData = loadUserData
exports.selectCompany = selectCompany
exports.getLoginRedirectPath = getLoginRedirectPath
exports.getUserID = getUserID
exports.preRedirectIfAuthenticated = preRedirectIfAuthenticated

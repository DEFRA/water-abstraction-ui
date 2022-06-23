'use strict'
const { pick, cloneDeep, get } = require('lodash')

const forms = require('shared/lib/forms')
const { handleFormRequest } = require('shared/lib/form-handler')
const routing = require('../lib/routing')
const session = require('../lib/session')
const { NEW_BILLING_ACCOUNT, OTHER_ACCOUNT } = require('../lib/constants')
const { logger } = require('../../../logger')
const services = require('../../../lib/connectors/services')
const mapper = require('../lib/mapper')

// Form containers
const selectBillingAccountForm = require('../forms/select-billing-account')
const selectAccountForm = require('../forms/select-account')
const selectFaoRequiredForm = require('../forms/select-fao-required')
const confirmForm = require('shared/lib/forms/confirm-form')

const NUNJUCKS_FORM_TEMPLATE = 'nunjucks/form'

const getDefaultView = request => {
  const { sessionData: { caption, back } } = request.pre
  return {
    ...request.view,
    back,
    caption
  }
}

const beginNewBillingAccountCreation = (request, h) => {
  const { key } = request.params

  session.setProperty(request, key, 'data.id', undefined)
  session.setProperty(request, key, 'data.company', request.pre.account)
  return h.redirect(routing.getSelectAccount(key))
}

/**
 * GET handler for selecting an existing billing account, or a new one
 */
const getSelectExistingBillingAccount = (request, h) => {
  // If no billing accounts to choose, redirect to start creation
  const { billingAccounts, account } = request.pre
  if (billingAccounts.length === 0) {
    return beginNewBillingAccountCreation(request, h)
  }

  return h.view(NUNJUCKS_FORM_TEMPLATE, {
    ...getDefaultView(request),
    pageTitle: `Select an existing billing account for ${account.name}`,
    form: handleFormRequest(request, selectBillingAccountForm)
  })
}

const postSelectExistingBillingAccount = async (request, h) => {
  const form = handleFormRequest(request, selectBillingAccountForm)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { billingAccountId } = forms.getValues(form)
  const { key } = request.params

  // Begin creating a new billing account
  if (billingAccountId === NEW_BILLING_ACCOUNT) {
    return beginNewBillingAccountCreation(request, h)
  }

  // Store selected account to session and redirect to parent flow
  const billingAccount = request.pre.billingAccounts.find(row => row.id === billingAccountId)
  const { redirectPath } = session.merge(request, key, { data: billingAccount })
  return h.redirect(redirectPath)
}

/**
 * GET handler for selecting if the billing account holder should pay the bills
 * or delegate it to an agent account
 */
const getSelectAccount = (request, h) => {
  const { isUpdate, back } = request.pre.sessionData

  return h.view(NUNJUCKS_FORM_TEMPLATE, {
    ...getDefaultView(request),
    pageTitle: 'Who should the bills go to?',
    form: handleFormRequest(request, selectAccountForm),
    back: isUpdate ? back : routing.getSelectExistingBillingAccount(request.params.key)
  })
}

const postSelectAccount = (request, h) => {
  const form = handleFormRequest(request, selectAccountForm)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { account, accountSearch } = forms.getValues(form)

  const { key } = request.params

  const agentCompany = get(request.pre, 'sessionData.data.agentCompany')
  const caption = get(request.pre, 'sessionData.caption')

  // Redirect to account selection flow
  if (account === OTHER_ACCOUNT) {
    const path = request.accountEntryRedirect({
      back: routing.getSelectAccount(key),
      redirectPath: routing.getHandleAgentAccountEntry(key),
      caption,
      searchQuery: accountSearch,
      key,
      ...agentCompany && { data: agentCompany }
    })
    return h.redirect(path)
  }

  // Store agent account to null
  session.setProperty(request, key, 'data.agentCompany', null)

  // Redirect to address selection
  return h.redirect(getAddressRedirectPath(request))
}

const getAddressRedirectPath = (request, query) => {
  const { key } = request.params
  const { caption, data, companyId } = session.get(request, key)
  return request.addressLookupRedirect({
    caption,
    key,
    back: routing.getSelectAccount(key),
    redirectPath: routing.getHandleAddressEntry(key, query),
    companyId: getCompanyId(data) || companyId,
    companyNumber: getCompanyNumber(data)
  })
}

/**
 * GET - Handle redirection from account entry flow for agent account
 */
const getHandleAgentAccountEntry = async (request, h) => {
  const { key } = request.params

  // Store selected agent account to session
  const company = request.getAccountEntry(key)
  session.setProperty(request, key, 'data.agentCompany', company)

  // Redirect to address selection
  return h.redirect(getAddressRedirectPath(request))
}

/**
 * GET handle redirection from address entry flow
 */
const getHandleAddressEntry = async (request, h) => {
  const { key } = request.params

  // Store selected address to session
  const address = request.getNewAddress(key)
  session.setProperty(request, key, 'data.address', address)

  // Redirect to FAO required/check answers screen
  const { checkAnswers } = request.query
  const path = checkAnswers ? routing.getCheckAnswers(key) : routing.getFAORequired(key)
  return h.redirect(path)
}

/**
 * GET - Select if FAO needed
 */
const getSelectFaoRequired = async (request, h) => h.view(NUNJUCKS_FORM_TEMPLATE, {
  ...getDefaultView(request),
  pageTitle: 'Do you need to add an FAO?',
  form: handleFormRequest(request, selectFaoRequiredForm),
  back: routing.getSelectExistingBillingAccount(request.params.key)
})

const getCompanyNumber = ({ company, agentCompany }) =>
  (agentCompany || company).companyNumber

const getCompanyId = ({ company, agentCompany }) => {
  if (agentCompany) {
    return agentCompany.id || null
  }
  return company.id
}

const postSelectFaoRequired = async (request, h) => {
  const form = handleFormRequest(request, selectFaoRequiredForm)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { key } = request.params
  const { faoRequired: isFaoRequired } = forms.getValues(form)

  // Redirect to contact entry if FAO required
  if (isFaoRequired) {
    const { sessionData: { caption } } = request.pre
    const path = request.contactEntryRedirect({
      caption,
      key,
      back: routing.getFAORequired(key),
      redirectPath: routing.getHandleContactEntry(key, request.query),
      companyId: getCompanyId(request.pre.sessionData.data)
    })
    return h.redirect(path)
  }

  // Set contact to null in session
  session.setProperty(request, key, 'data.contact', null)

  // Redirect to check answers
  return h.redirect(routing.getCheckAnswers(key))
}

const getHandleContactEntry = async (request, h) => {
  const { key } = request.params

  // Store selected contact to session
  const contact = request.getNewContact(key)
  session.setProperty(request, key, 'data.contact', contact)

  // Redirect to FAO required screen
  return h.redirect(routing.getCheckAnswers(key))
}

/**
 * GET check answers page
 */
const getCheckAnswers = (request, h) => {
  const { key } = request.params
  const { licences } = request.pre
  return h.view('nunjucks/billing-accounts/check-answers', {
    ...getDefaultView(request),
    pageTitle: 'Check billing account details',
    back: routing.getSelectExistingBillingAccount(request.params.key),
    ...request.pre.sessionData.data,
    links: {
      company: routing.getSelectAccount(key),
      address: getAddressRedirectPath(request, { checkAnswers: true }),
      fao: routing.getFAORequired(key)
    },
    licences,
    form: confirmForm.form(request, 'Confirm')
  })
}

const persistData = async state => {
  const clonedState = cloneDeep(state)
  const { isUpdate } = state

  // Create a new billing account if we are not doing an address update
  if (!isUpdate) {
    const invoiceAccount = await services.water.companies.postInvoiceAccount(state.companyId,
      mapper.mapSessionDataToCreateInvoiceAccount(state)
    )
    clonedState.data.id = invoiceAccount.id
  }

  // For both new account and address updates, post the agent, contact and address
  // to the create address endpoint
  const invoiceAccountAddress = await services.water.invoiceAccounts.createInvoiceAccountAddress(clonedState.data.id,
    mapper.mapSessionDataToCreateInvoiceAccountAddress(clonedState)
  )
  Object.assign(clonedState.data, pick(invoiceAccountAddress, ['address', 'agentCompany', 'contact']))
  return clonedState
}

const postCheckAnswers = async (request, h) => {
  try {
    const { data } = await persistData(request.pre.sessionData)
    // Set address in session and redirect back to parent flow
    const { key } = request.params
    const { redirectPath } = session.merge(request, key, { data })
    return h.redirect(redirectPath)
  } catch (err) {
    logger.error('Error saving billing account', err)
    throw err
  }
}

exports.getSelectExistingBillingAccount = getSelectExistingBillingAccount
exports.postSelectExistingBillingAccount = postSelectExistingBillingAccount

exports.getSelectAccount = getSelectAccount
exports.postSelectAccount = postSelectAccount

exports.getHandleAgentAccountEntry = getHandleAgentAccountEntry
exports.getHandleAddressEntry = getHandleAddressEntry

exports.getSelectFaoRequired = getSelectFaoRequired
exports.postSelectFaoRequired = postSelectFaoRequired

exports.getHandleContactEntry = getHandleContactEntry

exports.getCheckAnswers = getCheckAnswers
exports.postCheckAnswers = postCheckAnswers

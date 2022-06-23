'use strict'

const { omit } = require('lodash')

const forms = require('shared/lib/forms')
const routing = require('./lib/routing')
const session = require('./lib/session')

const { handleFormRequest } = require('shared/lib/form-handler')
const { NEW_ACCOUNT } = require('./lib/constants')
const { accountTypes, organisationTypes } = require('shared/lib/constants')

// Form containers
const selectExistingAccountForm = require('./forms/select-existing-account')
const selectAccountTypeForm = require('./forms/select-account-type')
const companySearchForm = require('./forms/company-search')
const companySearchSelectCompanyForm = require('./forms/company-search-select-company')

const NUNJUCKS_FORM_TEMPLATE = 'nunjucks/form'

const getDefaultView = request => {
  const { sessionData: { caption, back } } = request.pre
  return {
    ...request.view,
    back,
    caption
  }
}

/**
 * Displays a list of accounts already in the CRM DB to display
 * @param {String} request.query.q - search query
 */
const getSelectExistingAccount = (request, h) => {
  if (request.pre.companies.length === 0) {
    const { key } = request.params
    return h.redirect(routing.getSelectAccountType(key))
  }

  return h.view(NUNJUCKS_FORM_TEMPLATE, {
    ...getDefaultView(request),
    pageTitle: 'Does this account already exist?',
    form: handleFormRequest(request, selectExistingAccountForm)
  })
}

/**
 * Post handler for selection of existing account
 */
const postSelectExistingAccount = (request, h) => {
  const form = handleFormRequest(request, selectExistingAccountForm)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { companyId } = forms.getValues(form)
  const { key } = request.params

  // Begin creating a new account
  if (companyId === NEW_ACCOUNT) {
    return h.redirect(routing.getSelectAccountType(key))
  }

  // Store selected account to session and redirect to parent flow
  const company = request.pre.companies.find(row => row.id === companyId)
  const { redirectPath } = session.merge(request, key, { data: company })

  return h.redirect(redirectPath)
}

/**
 * Displays a list of account types for the new account,
 * with conditional reveal for name if a person account
 */
const getSelectAccountType = (request, h) => {
  const { sessionData: { searchQuery } } = request.pre

  return h.view(NUNJUCKS_FORM_TEMPLATE, {
    ...getDefaultView(request),
    pageTitle: 'Select the account type',
    form: handleFormRequest(request, selectAccountTypeForm),
    back: routing.getSelectExistingAccount(request.params.key, searchQuery)
  })
}

const postSelectAccountType = (request, h) => {
  const form = handleFormRequest(request, selectAccountTypeForm)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { key } = request.params

  // Store collected data to session
  const { accountType, personName } = forms.getValues(form)
  const isPerson = accountType === accountTypes.person

  // For a person account, we have finished, redirect to parent flow
  if (isPerson) {
    const { redirectPath } = session.merge(request, key, {
      data: {
        type: accountTypes.person,
        organisationType: organisationTypes.individual,
        name: personName
      }
    })
    return h.redirect(redirectPath)
  }

  // For a ltd company account, search companies house
  return h.redirect(routing.getCompanySearch(key))
}

/**
 * Search for company in companies house
 */
const getCompanySearch = (request, h) => {
  const { key } = request.params

  const companySearch = handleFormRequest(request, companySearchForm)
  const selectCompany = handleFormRequest(request, companySearchSelectCompanyForm)

  // If the user has searched for a company, display the list
  if (companySearch.isValid) {
    return h.view(NUNJUCKS_FORM_TEMPLATE, {
      ...getDefaultView(request),
      pageTitle: 'Select the registered company details',
      form: selectCompany,
      back: routing.getCompanySearch(key)
    })
  }

  // Otherwise display company search form
  return h.view(NUNJUCKS_FORM_TEMPLATE, {
    ...getDefaultView(request),
    pageTitle: 'Enter the company details',
    form: handleFormRequest(request, companySearchForm),
    back: routing.getSelectAccountType(key)
  })
}

const mapCompanySearchResult = row => omit(row.company, ['companyAddresses', 'companyContacts'])

const postCompanySearch = (request, h) => {
  const { key } = request.params
  const form = handleFormRequest(request, companySearchSelectCompanyForm)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  // Find selected company data
  const { selectedCompaniesHouseNumber } = forms.getValues(form)
  const company = request.pre.companiesHouseResults
    .map(mapCompanySearchResult)
    .find(row => row.companyNumber === selectedCompaniesHouseNumber)

  // Store in session and redirect
  const { redirectPath } = session.merge(request, key, {
    data: {
      ...company,
      type: accountTypes.organisation
    }
  })
  return h.redirect(redirectPath)
}

exports.getSelectExistingAccount = getSelectExistingAccount
exports.postSelectExistingAccount = postSelectExistingAccount

exports.getSelectAccountType = getSelectAccountType
exports.postSelectAccountType = postSelectAccountType

exports.getCompanySearch = getCompanySearch
exports.postCompanySearch = postCompanySearch

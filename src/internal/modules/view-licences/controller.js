'use strict'

const { pick, uniqWith, isEqual, get } = require('lodash')
const moment = require('moment')
const formHandler = require('shared/lib/form-handler')
const forms = require('./forms')
const mappers = require('./lib/mappers')
const { scope } = require('../../lib/constants')
const { hasScope } = require('../../lib/permissions')
const { featureToggles } = require('../../config')
const returnsMapper = require('../../lib/mappers/returns')
const services = require('../../lib/connectors/services')
const config = require('internal/config')
const { logger } = require('./../../../internal/logger.js')

const linkToLicenceChargeInformation = (licenceId) => {
  if (config.featureToggles.enableSystemLicenceView) {
    return `/system/licences/${licenceId}/set-up`
  } else {
    return `/licences/${licenceId}#charge`
  }
}

const linkToLicenceBills = (licenceId) => {
  if (config.featureToggles.enableSystemLicenceView) {
    return `/system/licences/${licenceId}/bills`
  } else {
    return `/licences/${licenceId}#bills`
  }
}

const getDocumentId = doc => doc.document_id

const getIsLicenceChargeVersionsEditingEnabled = licence =>
  licence.endDate === null || moment(licence.endDate).isAfter(moment().subtract(6, 'years'))

const getPermissions = request => {
  const isLicenceChargeInformationEditable = getIsLicenceChargeVersionsEditingEnabled(request.pre.licence)
  return {
    billing: hasScope(request, scope.billing),
    editChargeVersions: isLicenceChargeInformationEditable && hasScope(request, scope.chargeVersionWorkflowEditor),
    reviewChargeVersions: isLicenceChargeInformationEditable && hasScope(request, scope.chargeVersionWorkflowReviewer),
    manageAgreements: isLicenceChargeInformationEditable && hasScope(request, scope.manageAgreements)
  }
}

const getLinks = ({ licenceId, documentId }, permissions) => ({
  returns: `/licences/${documentId}/returns`,
  bills: permissions.billing && `/licences/${licenceId}/bills`,
  setupCharge: permissions.editChargeVersions && `/licences/${licenceId}/charge-information/create`,
  makeNonChargeable: permissions.editChargeVersions && `/licences/${licenceId}/charge-information/non-chargeable-reason?start=1`,
  addAgreement: permissions.manageAgreements && `/licences/${licenceId}/agreements/select-type`
})

/**
 * Main licence summary page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.licenceId - licence guid
 */
const getLicenceSummary = async (request, h) => {
  const { licenceId } = request.params
  const { agreements, licence, returns, document, gaugingStations } = request.pre
  const { data: gaugingStationsData } = gaugingStations
  const documentId = getDocumentId(document)

  const permissions = getPermissions(request)

  const chargeVersions = mappers.mapChargeVersions(
    request.pre.chargeVersions,
    request.pre.chargeVersionWorkflows,
    {
      licenceId,
      ...permissions
    }
  )

  const contacts = await services.crm.documentRoles.getDocumentRolesByDocumentRef(document.system_external_id)

  return h.view('nunjucks/view-licences/licence.njk', {
    ...request.view,
    pageTitle: `Licence ${licence.licenceNumber}`,
    featureToggles,
    licenceId,
    documentId,
    ...pick(request.pre, ['licence', 'bills', 'notifications', 'primaryUser', 'summary']),
    gaugingStationsData: uniqWith(gaugingStationsData, isEqual),
    chargeVersions,
    invoiceAccount: chargeVersions ? get(chargeVersions.find(cv => cv.status === 'current'), 'invoiceAccount', {}) : {},
    contacts,
    licenceHolder: contacts.data.find(con => con.roleName === 'licenceHolder'),
    agreements: mappers.mapLicenceAgreements(agreements, { licenceId, includeInSupplementaryBilling: licence.includeInSupplementaryBilling, ...permissions }),
    returns: {
      pagination: returns.pagination,
      data: returnsMapper.mapReturns(returns.data, request)
    },
    links: getLinks({ licenceId, documentId }, permissions),
    validityMessage: mappers.getValidityNotice(licence),
    includeInSupplementaryBillingMessage: _includeInSupplementaryBillingMessage(licence),
    back: '/licences'
  })
}

/**
 * Get a list of bills for a particular licence
 * @param {String} request.params.documentId - the CRM doc ID for the licence
 * @param {Number} request.query.page - the page number for paginated results
 */
const getBillsForLicence = async (request, h) => {
  const { licenceId } = request.params
  const { document } = request.pre

  const { data, pagination } = request.pre.bills

  return h.view('nunjucks/billing/bills', {
    ...request.view,
    pageTitle: document.metadata.Name,
    caption: document.system_external_id,
    tableCaption: 'All sent bills',
    bills: data,
    pagination,
    licenceId,
    back: linkToLicenceBills(licenceId)
  })
}

const getMarkLicenceForSupplementaryBilling = (request, h) => {
  const { licenceId } = request.params
  const { document } = request.pre
  const { system_external_id: licenceRef } = document

  return h.view('nunjucks/billing/mark-licence-for-supplementary-billing', {
    ...request.view,
    pageTitle: 'You\'re about to mark this licence for the next supplementary bill run',
    caption: `Licence ${licenceRef}`,
    form: formHandler.handleFormRequest(request, forms.markForSupplementaryBilling),
    back: linkToLicenceChargeInformation(licenceId)
  })
}

const postMarkLicenceForSupplementaryBilling = async (request, h) => {
  const { licenceId } = request.params
  const { returnId } = request.payload
  const cookie = request.headers.cookie

  const { document } = request.pre
  const { system_external_id: licenceRef } = document

  // Call backend to mark the licence for supplementary billing
  await services.water.licences.postMarkLicenceForSupplementaryBilling(licenceId)

  if (returnId) {
    try {
      await services.system.licences.supplementary(returnId, cookie)
    } catch (error) {
      logger.error('Flag supplementary request to system failed', error.stack)
    }
  }

  return h.view('nunjucks/billing/marked-licence-for-supplementary-billing', {
    ...request.view,
    pageTitle: 'You\'ve marked this licence for the next supplementary bill run',
    panelText: `Licence number: ${licenceRef}`,
    licenceId
  })
}

const _includeInSupplementaryBillingMessage = (licence) => {
  const includeInPresroc = ['yes', 'reprocess'].includes(licence.includeInSupplementaryBilling)
  const includeInSroc = licence.includeInSrocSupplementaryBilling

  let message = null
  if (includeInPresroc && includeInSroc) {
    message = 'This licence has been marked for the next supplementary bill runs for the current and old charge schemes.'
  } else if (includeInPresroc) {
    message = 'This licence has been marked for the next supplementary bill run for the old charge scheme.'
  } else if (includeInSroc) {
    message = 'This licence has been marked for the next supplementary bill run.'
  }

  return message
}

exports.getLicenceSummary = getLicenceSummary
exports.getBillsForLicence = getBillsForLicence
exports.getMarkLicenceForSupplementaryBilling = getMarkLicenceForSupplementaryBilling
exports.postMarkLicenceForSupplementaryBilling = postMarkLicenceForSupplementaryBilling

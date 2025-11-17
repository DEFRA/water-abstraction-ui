'use strict'

const Boom = require('@hapi/boom')
const services = require('../../lib/connectors/services')
const { loadLicence } = require('shared/lib/pre-handlers/licences')
const moment = require('moment')
const { get, sortBy, isEmpty, pick } = require('lodash')
const { v4: uuid } = require('uuid')
const { flattenAdditionalChargesProperties } = require('./lib/mappers')

const { featureToggles } = require('../../config.js')

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message)
  }
  throw err
}

const linkToLicenceChargeInformation = (licenceId) => {
  return `/system/licences/${licenceId}/set-up`
}

const getChargeVersionWorkflowId = request => request.query.chargeVersionWorkflowId || request.params.chargeVersionWorkflowId

/**
 * Loads draft charge information for the specified licence from the cache
 * @param {String} request - licence ID from water.licences.licence_id
 * @returns {Promise<Object>}
 */
const loadDraftChargeInformation = async request =>
  request.getDraftChargeInformation(request.params.licenceId, getChargeVersionWorkflowId(request))

const getFilteredChangeReasons = async type => {
  try {
    const { data: changeReasons } = await services.water.changeReasons.getChangeReasons()
    return changeReasons.filter(reason => reason.type === type)
  } catch (err) {
    return errorHandler(err, 'Change reasons not found')
  }
}

const findChargeCategory = async chargeElement => {
  const keys = ['source', 'loss', 'isRestrictedSource', 'waterModel', 'volume']
  const chargeCategory = await services.water.chargeCategories.getChargeCategory(pick(chargeElement, keys))
  return {
    id: chargeCategory.billingChargeCategoryId,
    reference: chargeCategory.reference,
    shortDescription: chargeCategory.shortDescription
  }
}

const restoreChargeElements = async chargeElements => {
  // filter out incomplete charge elements when they have used the back button
  const completeChargeElements = await Promise.all(chargeElements
    .filter(element => !element.status)
    .map(async element => {
      if (element.scheme === 'sroc') {
        element.chargeCategory = await findChargeCategory(element)
      }
      return element
    }))

  // retrieve charge elements converted to charge purposes when they have used the back button
  const restoredChargeElements = chargeElements
    .filter(element => element.status === 'draft')
    .flatMap(element => {
      const { chargePurposes } = element
      return chargePurposes && chargePurposes.length ? chargePurposes.map(purpose => ({ ...purpose, scheme: 'alcs' })) : []
    })

  return [
    ...completeChargeElements,
    ...restoredChargeElements
  ]
}

/**
 * Removes incomplete charge elements to avoid breaking the UI
 * and resets the session draftCharge info
 * @param {*} request
 */
const loadValidatedDraftChargeInformation = async request => {
  const { licenceId } = request.params
  const chargeVersionWorkFlowId = getChargeVersionWorkflowId(request)
  const draftChargeInformation = await loadDraftChargeInformation(request)

  draftChargeInformation.chargeElements = await restoreChargeElements(draftChargeInformation.chargeElements)

  request.clearDraftChargeInformation(licenceId, chargeVersionWorkFlowId)
  request.setDraftChargeInformation(licenceId, chargeVersionWorkFlowId, draftChargeInformation)
  return draftChargeInformation
}

/**
 * Loads list of chargeable change reasons or a Boom 404 error if not found
 *
 * @returns {Promise<Object>}
 */
const loadChargeableChangeReasons = () => getFilteredChangeReasons('new_chargeable_charge_version')

/**
 * Loads list of non chargeable change reasons or a Boom 404 error if not found
 *
 * @returns {Promise<Object>}
 */
const loadNonChargeableChangeReasons = () => getFilteredChangeReasons('new_non_chargeable_charge_version')

const loadIsChargeable = async request => {
  const type = get(request.getDraftChargeInformation(request.params.licenceId, getChargeVersionWorkflowId(request)), 'changeReason.type', null)
  return type === 'new_chargeable_charge_version'
}

const getPaddedVersionString = version => version.toString().padStart(9, '0')
const getSortableVersionNumber = obj => parseFloat(`${getPaddedVersionString(obj.issue)}.${getPaddedVersionString(obj.increment)}`)

const loadDefaultCharges = async request => {
  const { licenceId } = request.params
  try {
    const draftChargeInfo = await loadDraftChargeInformation(request)
    const startDate = new Date(draftChargeInfo.dateRange.startDate)
    //  Find non 'draft' licence versions for the licenceId where the draft charge version start date is in the date range of
    //  licence versions then pick the licence version with the greatest version number.
    const versions = await services.water.licences.getLicenceVersions(licenceId)
    const versionsFiltered = versions.filter(v => {
      return v.status !== 'draft' && moment.range(v.startDate, v.endDate).contains(startDate)
    })

    const version = sortBy(versionsFiltered, getSortableVersionNumber).pop()

    return version ? await services.water.chargeVersions.getDefaultChargesForLicenceVersion(version.id) : []
  } catch (err) {
    return errorHandler(err, `Default charges not found for licence ${licenceId}`)
  }
}

const loadChargeVersions = async request => {
  const { licenceId } = request.params
  try {
    const { data } = await services.water.chargeVersions.getChargeVersionsByLicenceId(licenceId)
    const chargeVersions = await Promise.all(data.map(async chargeVersion => {
      if (chargeVersion.note) {
        const { user_name: email } = await services.idm.users.findOneById(chargeVersion.note.userId) || {}
        chargeVersion.note.user = { email }
      }
      return chargeVersion
    }))
    return sortBy(chargeVersions, ['dateRange.startDate', 'versionNumber'])
  } catch (err) {
    return errorHandler(err, `Cannot load charge versions for licence ${licenceId}`)
  }
}

const loadChargeVersion = async request => {
  const { chargeVersionId } = request.params
  try {
    const chargeVersion = await services.water.chargeVersions.getChargeVersion(chargeVersionId)
    if (chargeVersion.note) {
      const { user_name: email } = await services.idm.users.findOneById(chargeVersion.note.userId) || {}
      chargeVersion.note.user = { email }
    }
    if (chargeVersion.scheme === 'sroc') {
      chargeVersion.chargeElements = chargeVersion.chargeElements.map(element => {
        element.isAdjustments = !isEmpty(element.adjustments)
        return flattenAdditionalChargesProperties(element)
      })
    }
    return chargeVersion
  } catch (err) {
    return errorHandler(err, `Cannot load charge version ${chargeVersionId}`)
  }
}

const decorateChargeVersion = chargeVersionWorkflow => {
  const { chargeVersion, status, approverComments } = chargeVersionWorkflow
  // set id of saved address to display
  const invoiceAccountAddress = get(chargeVersion, 'invoiceAccount.invoiceAccountAddresses[0].id', null)

  // Give each charge element a GUID if it doesn't have one
  const { chargeElements } = chargeVersion
  chargeVersion.chargeElements = chargeElements.map(element => {
    if (!element.id) {
      element.id = uuid()
      if (element.chargePurposes) {
        element.chargePurposes = element.chargePurposes.map(purpose => {
          if (!purpose.id) {
            purpose.id = uuid()
          }
          return purpose
        })
      }
      element.isAdjustments = !isEmpty(element.adjustments)
      element.adjustments = element.adjustments ? element.adjustments : {}
    }
    return flattenAdditionalChargesProperties(element)
  })

  return {
    ...chargeVersion,
    status,
    approverComments,
    invoiceAccount: { ...chargeVersion.invoiceAccount, invoiceAccountAddress }
  }
}

const getChargeVersionWorkflow = async id =>
  services.water.chargeVersionWorkflows.getChargeVersionWorkflow(id)

const chargeVersionWorkflowsOrder = ['licence.startDate']

const loadChargeVersionWorkflows = async request => {
  const { toSetupPageNumber, reviewPageNumber, changeRequestPageNumber } = request.query
  try {
    const workflows = await services.water.chargeVersionWorkflows.getChargeVersionWorkflows(toSetupPageNumber, 100, 'to_setup')
    workflows.data.forEach((workflow) => {
      const { data, licenceId } = workflow

      if (featureToggles.useWorkflowSetupLinks && data?.timeLimitedChargeVersionId) {
        workflow.link = {
          href: `/licences/${licenceId}/charge-information/${data.timeLimitedChargeVersionId}/view`,
          text: 'Time limited'
        }
      } else if (featureToggles.useWorkflowSetupLinks && data?.chargeVersionExists) {
        workflow.link = {
          href: linkToLicenceChargeInformation(licenceId),
          text: 'Updated'
        }
      } else if (featureToggles.enableSystemLicenceView) {
        workflow.link = {
          href: `/system/licences/${licenceId}/set-up`,
          text: 'Set up'
        }
      } else {
        workflow.link = {
          href: `/licences/${licenceId}#charge`,
          text: 'Set up'
        }
      }
    })

    return {
      data: sortBy(workflows.data, chargeVersionWorkflowsOrder),
      pagination: {
        ...workflows.pagination,
        page: toSetupPageNumber,
        next: { toSetupPageNumber: toSetupPageNumber + 1, reviewPageNumber, changeRequestPageNumber },
        previous: { toSetupPageNumber: toSetupPageNumber - 1, reviewPageNumber, changeRequestPageNumber }
      }
    }
  } catch (err) {
    return errorHandler(err, 'Could not retrieve charge version workflows tab setup.')
  }
}

const loadChargeVersionWorkflowsReview = async request => {
  const { reviewPageNumber, toSetupPageNumber, changeRequestPageNumber } = request.query
  try {
    const workflows = await services.water.chargeVersionWorkflows.getChargeVersionWorkflows(reviewPageNumber, 100, 'review')
    return {
      data: sortBy(workflows.data, chargeVersionWorkflowsOrder),
      pagination: {
        ...workflows.pagination,
        page: reviewPageNumber,
        next: { reviewPageNumber: reviewPageNumber + 1, toSetupPageNumber, changeRequestPageNumber },
        previous: { reviewPageNumber: reviewPageNumber - 1, toSetupPageNumber, changeRequestPageNumber }
      }
    }
  } catch (err) {
    return errorHandler(err, 'Could not retrieve charge version workflows tab review.')
  }
}

const loadChargeVersionWorkflowsChangeRequest = async request => {
  const { changeRequestPageNumber, toSetupPageNumber, reviewPageNumber } = request.query
  try {
    const workflows = await services.water.chargeVersionWorkflows.getChargeVersionWorkflows(changeRequestPageNumber, 100, 'changes_requested')
    return {
      data: sortBy(workflows.data, chargeVersionWorkflowsOrder),
      pagination: {
        ...workflows.pagination,
        page: changeRequestPageNumber,
        next: { changeRequestPageNumber: changeRequestPageNumber + 1, toSetupPageNumber, reviewPageNumber },
        previous: { changeRequestPageNumber: changeRequestPageNumber - 1, toSetupPageNumber, reviewPageNumber }
      }
    }
  } catch (err) {
    return errorHandler(err, 'Could not retrieve charge version workflows tab changes requested.')
  }
}

const loadChargeVersionWorkflow = async request => {
  const chargeVersionWorkflowId = getChargeVersionWorkflowId(request)
  try {
    return getChargeVersionWorkflow(chargeVersionWorkflowId)
  } catch (err) {
    return errorHandler(err, `Cannot load charge version workflow ${chargeVersionWorkflowId}`)
  }
}

const loadChargeInformation = async request => {
  const { licenceId } = request.params
  const chargeVersionWorkflowId = getChargeVersionWorkflowId(request)
  let draftChargeInfo = await loadValidatedDraftChargeInformation(request)
  try {
    if (!draftChargeInfo.changeReason) {
      const chargeVersionWorkflow = await getChargeVersionWorkflow(chargeVersionWorkflowId)
      draftChargeInfo = decorateChargeVersion(chargeVersionWorkflow)
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, {
        ...draftChargeInfo,
        chargeVersionWorkflowId
      })
    }
    return draftChargeInfo
  } catch (err) {
    return errorHandler(err, `Cannot load charge version workflow ${chargeVersionWorkflowId}`)
  }
}

const loadLicenceHolderRole = async request => {
  const { licenceId } = request.params
  const { startDate } = request.pre.draftChargeInformation.dateRange

  try {
    const { roles } = await services.water.licences.getValidDocumentByLicenceIdAndDate(licenceId, startDate)
    return roles.find(role => role.roleName === 'licenceHolder')
  } catch (err) {
    return errorHandler(err, `Cannot load document for licence ${licenceId} on ${startDate}`)
  }
}

const loadSupportedSources = async () => {
  try {
    const { data: supportedSources } = await services.water.supportedSources.getSupportedSources()
    return sortBy(supportedSources, ['order'])
  } catch (err) {
    return errorHandler(err, 'Cannot load supported sources')
  }
}

const getBillingAccount = invoiceAccountId => invoiceAccountId
  ? services.water.invoiceAccounts.getInvoiceAccount(invoiceAccountId)
  : null

const loadBillingAccount = async request => {
  const { licenceId } = request.params
  const chargeVersionWorkflowId = getChargeVersionWorkflowId(request)
  const state = request.getDraftChargeInformation(licenceId, chargeVersionWorkflowId)
  const invoiceAccountId = get(state, 'invoiceAccount.id')
  return getBillingAccount(invoiceAccountId)
}

const loadBillingAccountByChargeVersion = async request => {
  const invoiceAccountId = get(request, 'pre.chargeVersion.invoiceAccount.id')
  return getBillingAccount(invoiceAccountId)
}

exports.loadChargeableChangeReasons = loadChargeableChangeReasons
exports.loadChargeVersion = loadChargeVersion
exports.loadChargeVersions = loadChargeVersions
exports.loadChargeVersionWorkflows = loadChargeVersionWorkflows
exports.loadChargeVersionWorkflowsReview = loadChargeVersionWorkflowsReview
exports.loadChargeVersionWorkflowsChangeRequest = loadChargeVersionWorkflowsChangeRequest
exports.loadChargeVersionWorkflow = loadChargeVersionWorkflow
exports.loadChargeInformation = loadChargeInformation
exports.loadDefaultCharges = loadDefaultCharges
exports.loadDraftChargeInformation = loadDraftChargeInformation
exports.loadLicence = loadLicence
exports.loadIsChargeable = loadIsChargeable
exports.loadNonChargeableChangeReasons = loadNonChargeableChangeReasons
exports.loadLicenceHolderRole = loadLicenceHolderRole
exports.loadSupportedSources = loadSupportedSources
exports.loadBillingAccount = loadBillingAccount
exports.loadBillingAccountByChargeVersion = loadBillingAccountByChargeVersion
exports.loadValidatedDraftChargeInformation = loadValidatedDraftChargeInformation

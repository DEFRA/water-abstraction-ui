'use strict'

const { isFunction, isEmpty, get } = require('lodash')
const Joi = require('joi')
const { handleRequest, getValues } = require('shared/lib/forms')
const sessionForms = require('shared/lib/session-forms')
const services = require('../../../lib/connectors/services')

const { reducer } = require('./reducer')
const routing = require('../lib/routing')
const { ROUTING_CONFIG } = require('../lib/charge-categories/constants')
const actions = require('../lib/actions')
const noteSession = require('../../../modules/notes/lib/session')
const config = require('internal/config')

const getPostedForm = (request, formContainer) => {
  const schema = Joi.isSchema(formContainer.schema) ? formContainer.schema : formContainer.schema(request)
  return handleRequest(formContainer.form(request), request, schema)
}

const applyFormResponse = async (request, form, actionCreator) => {
  const { licenceId } = request.params
  const { chargeVersionWorkflowId } = request.query
  const action = actionCreator(request, getValues(form))
  const nextState = reducer(request.pre.draftChargeInformation, action)
  const restartFlow = nextState.restartFlow
  // if the restartFlow property exist the charge info has to be recreated because i.e. change in chargin scheme
  if (restartFlow) {
    request.clearDraftChargeInformation(licenceId, chargeVersionWorkflowId)
    nextState.restartFlow = false
    await request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, nextState)
    return true
  } else {
    await isEmpty(nextState)
      ? request.clearDraftChargeInformation(licenceId, chargeVersionWorkflowId)
      : request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, nextState)
    return false
  }
}

/**
 * Determine whether the url is part of the charge information
 * flow to allow the user to go through an external multi-page flow
 * before returning to the check your answers page
 * @param {String} url
 */
const isUrlChargeInformationPage = url => {
  const [baseUrl] = url.split('?')
  return baseUrl.includes('charge-information')
}

const getRedirectPath = (request, nextPageInFlowUrl) => {
  const { returnToCheckData, chargeVersionWorkflowId } = request.query
  const isChargeInformationPage = isUrlChargeInformationPage(nextPageInFlowUrl)
  if (returnToCheckData && isChargeInformationPage) {
    if (request.pre.draftChargeInformation.status === 'review') {
      return routing.getReview(chargeVersionWorkflowId, request.params.licenceId)
    }
    return routing.getCheckData(request.params.licenceId, { chargeVersionWorkflowId })
  }
  return nextPageInFlowUrl
}

const createPostHandler = (formContainer, actionCreator, redirectPathFunc) => async (request, h) => {
  const form = getPostedForm(request, formContainer)

  if (form.isValid) {
    const restartFlow = await applyFormResponse(request, form, actionCreator)
    const defaultPath = await redirectPathFunc(request, getValues(form))
    const redirectPath = await getRedirectPath(request, defaultPath)
    return restartFlow ? h.redirect(defaultPath) : h.redirect(redirectPath)
  }
  return h.postRedirectGet(form)
}

const getDefaultView = (request, backLink, formContainer) => {
  const licence = request.pre.licence
  const back = isFunction(backLink) ? backLink(licence.id, request.query) : backLink

  const view = {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    back
  }
  if (formContainer) {
    view.form = sessionForms.get(request, formContainer.form(request))
  }
  return view
}

const prepareChargeInformation = (licenceId, chargeData) => ({
  licenceId,
  chargeVersion: {
    ...chargeData,
    chargeElements: chargeData.chargeElements.map((
      {
        id,
        adjustments,
        isAdjustments,
        isAdditionalCharges,
        isSupportedSource,
        supportedSourceName,
        supportedSourceId,
        isSupplyPublicWater,
        chargePurposes,
        ...element
      }) => {
      if (chargeData.scheme === 'sroc') {
        const additionalCharges = isAdditionalCharges
          ? {
              supportedSource: isSupportedSource
                ? { id: supportedSourceId, name: supportedSourceName }
                : null,
              isSupplyPublicWater
            }
          : null
        return {
          ...element,
          additionalCharges,
          adjustments: isAdjustments ? adjustments : {},
          chargePurposes: chargePurposes.map(({ id: _unused, ...purpose }) => purpose)
        }
      } else {
        return element
      }
    }),
    status: 'draft'
  }
})

const linkToLicenceChargeInformation = (licenceId) => {
  return `/system/licences/${licenceId}/set-up`
}

const getLicencePageUrl = (licence) => {
  return linkToLicenceChargeInformation(licence.id)
}

const isCurrentAddress = invoiceAccountAddress => invoiceAccountAddress.dateRange.endDate === null

const getCurrentBillingAccountAddress = billingAccount => get(billingAccount, 'invoiceAccountAddresses', []).find(isCurrentAddress)

const getChargeCategoryFirstStep = request => {
  if (getAlcsCount(request) > 1) {
    return ROUTING_CONFIG.whichElement.step
  } else {
    return ROUTING_CONFIG.description.step
  }
}

const getAlcsCount = request => {
  const { draftChargeInformation } = request.pre
  return draftChargeInformation.chargeElements.filter(element => element.scheme === 'alcs').length
}

/**
 * Checks if the new draft charge version has the same start date as an existing charge version
 * @param {*} request hapi request object
 * @param {*} draftChargeVersionStartDate the start date of the draft charge version
 */
const isOverridingChargeVersion = async (request, draftChargeVersionStartDate) => {
  const { data: chargeVersions } = await services.water.chargeVersions.getChargeVersionsByLicenceId(request.pre.licence.id)
  return !!chargeVersions.find(version => version.dateRange.startDate === draftChargeVersionStartDate)
}

const processElements = (request, id, selectedElementIds) => {
  const { chargeVersionWorkflowId } = request.query
  const { licenceId, elementId = id } = request.params
  const { draftChargeInformation: currentState } = request.pre

  // Move all newly selected to charge purposes
  const data = currentState.chargeElements.reduce((acc, element) => {
    if (element.scheme === 'alcs' && (!selectedElementIds || selectedElementIds.includes(element.id))) {
      acc.chargePurposes.push({ ...element, scheme: 'sroc' })
    } else if (element.scheme === 'sroc' && element.id === elementId) {
      const { chargePurposes, ...chargeElement } = element
      acc.chargeElements.push(chargeElement)
      chargePurposes.forEach(purpose => {
        if (selectedElementIds && !selectedElementIds.includes(purpose.id)) {
          acc.chargeElements.push({ ...purpose, scheme: 'alcs' })
        } else {
          acc.chargePurposes.push(purpose)
        }
      })
    } else {
      acc.chargeElements.push(element)
    }
    return acc
  }, { chargeElements: [], chargePurposes: [] })

  // Move all the newly unselected to charge elements
  const action = actions.updateChargeCategory(elementId, data.chargeElements, data.chargePurposes)
  const nextState = reducer(currentState, action)
  request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, nextState)
}

const clearNoteSessionData = request => {
  const noteId = get(request, 'pre.draftChargeInformation.note.id')
  if (noteId) {
    noteSession.clear(request, noteId)
  }
}

exports.isOverridingChargeVersion = isOverridingChargeVersion
exports.getLicencePageUrl = getLicencePageUrl
exports.getPostedForm = getPostedForm
exports.applyFormResponse = applyFormResponse
exports.createPostHandler = createPostHandler
exports.processElements = processElements
exports.getDefaultView = getDefaultView
exports.prepareChargeInformation = prepareChargeInformation
exports.getChargeCategoryFirstStep = getChargeCategoryFirstStep
exports.getAlcsCount = getAlcsCount
exports.getCurrentBillingAccountAddress = getCurrentBillingAccountAddress
exports.clearNoteSessionData = clearNoteSessionData

const { find, omit, get, isEmpty } = require('lodash')
const moment = require('moment')
const { v4: uuid } = require('uuid')
const DATE_FORMAT = 'YYYY-MM-DD'
const chargeElementMappers = require('./charge-elements/mappers')
const chargeCategoryMappers = require('./charge-categories/mappers')
const { CHARGE_ELEMENT_STEPS } = require('./charge-elements/constants')
const { ROUTING_CONFIG } = require('./charge-categories/constants')
const { srocStartDate } = require('../../../config')
const { flattenAdditionalChargesProperties } = require('internal/modules/charge-information/lib/mappers')
const ACTION_TYPES = {
  clearData: 'clearData',
  setBillingAccount: 'set.invoiceAccount',
  setReason: 'set.reason',
  setStartDate: 'set.startDate',
  setChargeElementData: 'set.chargeElementData',
  setChargeCategoryData: 'set.chargeCategoryData',
  createChargeElement: 'create.chargeElement',
  createChargeCategory: 'create.chargeCategory',
  updateChargeCategory: 'update.chargeCategory',
  setAbstractionData: 'set.abstractionData',
  setChargePurposeData: 'set.chargePurposeData'
}

const setChangeReason = (request, formValues) => {
  if (formValues.reason === 'non-chargeable') {
    return {
      type: ACTION_TYPES.clearData
    }
  }
  return {
    type: ACTION_TYPES.setReason,
    payload: find(request.pre.changeReasons, { id: formValues.reason })
  }
}

const setStartDate = (request, formValues) => {
  let payload
  const earliestLicenceVersionStartDate = moment.min(request.pre.licenceVersions.map(x => moment(x.startDate)))
  const licenceVersionEffectiveDate = get(request.pre.licenceVersions.find(x => x.status === 'current'), 'startDate')

  const dates = {
    earliestLicenceVersionStartDate,
    licenceVersionEffectiveDate,
    today: moment().format(DATE_FORMAT),
    customDate: formValues.customDate
  }

  const scheme = new Date(dates[formValues.startDate]) >= srocStartDate ? 'sroc' : 'alcs'

  // if the charing scheme switches then the restartFlow flag
  // is used to clear the draft charge information and restart the flow from this step onwards
  if (scheme !== request.pre.draftChargeInformation.scheme || request.pre.draftChargeInformation.chargeElements.length === 0) {
    payload = {
      restartFlow: true,
      chargeElements: [],
      changeReason: request.pre.draftChargeInformation.changeReason,
      dateRange: { startDate: dates[formValues.startDate] },
      scheme
    }
  } else {
    payload = {
      ...request.pre.draftChargeInformation,
      dateRange: { startDate: dates[formValues.startDate] }
    }
  }

  return {
    type: ACTION_TYPES.setStartDate,
    payload
  }
}

const setBillingAccount = id => ({
  type: ACTION_TYPES.setBillingAccount,
  payload: {
    billingAccountId: id
  }
})

const mapChargeElementData = chargeElements =>
  chargeElements.map(element => flattenAdditionalChargesProperties({
    scheme: 'alcs', // default to 'alcs'
    ...element,
    id: uuid(), // overrides the id
    isAdjustments: !isEmpty(element.adjustments)
  }))

const setAbstractionData = (request, formValues) => {
  let chargeElements = []
  let note
  if (formValues.useAbstractionData === 'yes') {
    chargeElements = mapChargeElementData(request.pre.defaultCharges)
  } else if (formValues.useAbstractionData !== 'no') {
    const chargeVersion = request.pre.chargeVersions.find(cv => cv.id === formValues.useAbstractionData)
    chargeElements = mapChargeElementData(chargeVersion.chargeElements)
    note = get(chargeVersion, 'note')
    if (note) {
      const { userName, userId } = request.defra // Logged in user details
      note.user = {
        email: userName,
        id: userId
      }
    }
  }
  return {
    type: ACTION_TYPES.setAbstractionData,
    payload: note ? { chargeElements, note } : { chargeElements }
  }
}

// gets the charge element data from the posted form and omits the csrf token to
// avoid saving this in the draft charge info session cache
const getNewChargeElementData = (request, formValues, scheme) => {
  const { defaultCharges } = request.pre
  const { step } = request.params
  if (scheme === 'alcs') {
    return chargeElementMappers[step] ? chargeElementMappers[step](formValues, defaultCharges) : omit(formValues, 'csrf_token')
  }
  return chargeCategoryMappers[step] ? chargeCategoryMappers[step](formValues, request.payload) : omit(formValues, 'csrf_token')
}

// gets the charge purpose data from the posted form for SROC and omits
// the csrf token to avoid saving this in the draft charge info session cache
const getNewChargePurposeData = (request, formValues) => {
  const { defaultCharges } = request.pre
  const { step } = request.params
  return chargeElementMappers[step] ? chargeElementMappers[step](formValues, defaultCharges) : omit(formValues, 'csrf_token')
}

const setChargeElementData = (request, formValues) => {
  const { draftChargeInformation } = request.pre
  const { elementId, step } = request.params
  const { returnToCheckData } = request.query

  const chargeElementToUpdate = draftChargeInformation.chargeElements.find(element => element.id === elementId)
  const data = chargeElementToUpdate
    ? getNewChargeElementData(request, formValues, chargeElementToUpdate.scheme)
    // if the charge element has not been added to the draft charge data then it is an ALCS charge element and we add the scheme
    : getNewChargeElementData(request, formValues, 'alcs')

  if (step === CHARGE_ELEMENT_STEPS.purpose && !returnToCheckData) {
    data.status = 'draft'
  }
  if ((step === CHARGE_ELEMENT_STEPS.loss || step === ROUTING_CONFIG.isAdjustments.step) && chargeElementToUpdate) {
    delete chargeElementToUpdate.status
  }
  chargeElementToUpdate
    ? Object.assign(chargeElementToUpdate, data)
    : draftChargeInformation.chargeElements.push({ ...data, id: elementId })

  return {
    type: ACTION_TYPES.setChargeElementData,
    payload: draftChargeInformation.chargeElements
  }
}

const removeChargeElement = request => {
  const { draftChargeInformation: { chargeElements } } = request.pre
  const { buttonAction } = request.payload
  const [, chargeElementId] = buttonAction.split(':')
  const updatedChargeElements = chargeElements.filter(element => element.id !== chargeElementId)

  return {
    type: ACTION_TYPES.setChargeElementData,
    payload: updatedChargeElements
  }
}

const clearData = () => {
  return {
    type: ACTION_TYPES.clearData
  }
}

const createChargeElement = id => ({
  type: ACTION_TYPES.createChargeElement,
  payload: {
    id,
    scheme: 'alcs',
    status: 'draft'
  }
})

const createChargeCategory = (id, chargeElements, chargePurposes, eiucRegion) => ({
  type: ACTION_TYPES.createChargeCategory,
  payload: [
    ...chargeElements,
    {
      id,
      eiucRegion,
      chargePurposes,
      scheme: 'sroc',
      status: 'draft'
    }]
})

const updateChargeCategory = (id, chargeElements, chargePurposes) => ({
  type: ACTION_TYPES.updateChargeCategory,
  payload: chargeElements.map(element => element.id === id ? { ...element, chargePurposes } : element)
})

const setChargePurposeData = (request, formValues) => {
  const { draftChargeInformation } = request.pre
  const { categoryId } = request.query
  const { elementId } = request.params
  // get rid of the csrf token to avoid saving this in the draft charge info session cache
  const data = getNewChargePurposeData(request, formValues)

  const chargeElements = draftChargeInformation.chargeElements
    .map(element => {
      if (element.id === categoryId) {
        element.chargePurposes.map(purpose => {
          if (purpose.id === elementId) {
            return Object.assign(purpose, data)
          }
          return purpose
        })
      }
      return element
    })
  return {
    type: ACTION_TYPES.setChargeElementData,
    payload: chargeElements
  }
}

exports.ACTION_TYPES = ACTION_TYPES

exports.clearData = clearData
exports.setAbstractionData = setAbstractionData
exports.setBillingAccount = setBillingAccount
exports.setChangeReason = setChangeReason
exports.setStartDate = setStartDate
exports.setChargeElementData = setChargeElementData
exports.removeChargeElement = removeChargeElement
exports.createChargeElement = createChargeElement
exports.createChargeCategory = createChargeCategory
exports.updateChargeCategory = updateChargeCategory
exports.setChargePurposeData = setChargePurposeData

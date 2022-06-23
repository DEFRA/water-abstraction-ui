const session = require('./session')
const services = require('../../../lib/connectors/services')
const { get, omit, set, chain } = require('lodash')

const blankGuid = '00000000-0000-0000-0000-000000000000'

const redirectTo = (request, h, path) => {
  const { checkStageReached } = session.get(request)

  if (checkStageReached === true && !['/condition', '/abstraction-period'].includes(path)) {
    return h.redirect(request.path.replace(/\/[^/]*$/, '/check'))
  } else {
    return h.redirect(request.path.replace(/\/[^/]*$/, path))
  }
}

const isLicenceNumberValid = async request => {
  try {
    const licence = await services.water.licences.getLicenceByLicenceNumber(request.payload.licenceNumber)
    session.merge(request, {
      fetchedLicence: licence
    })
    return !!licence
  } catch (err) {
    session.merge(request, {
      fetchedLicence: undefined
    })
    return false
  }
}

const fetchConditionsForLicence = async request => {
  try {
    const sessionData = session.get(request)
    const { data } = await services.water.licenceVersionPurposeConditionsService
      .getLicenceVersionPurposeConditionsByLicenceId(sessionData.fetchedLicence.id, { qs: { code: 'CES' } })
    return data
  } catch (err) {
    return []
  }
}

const getCaption = async request => {
  const { gaugingStationId } = request.params
  const { label, riverName } = await services.water.gaugingStations.getGaugingStationbyId(gaugingStationId)
  return `${riverName ? riverName + ' at ' : ''}${label}`
}

const getSelectedConditionText = request => {
  const { conditionsForSelectedLicence } = request.pre
  const sessionData = session.get(request)
  const selectedCondition = get(sessionData, 'condition.value', null)

  if (selectedCondition) {
    return get(conditionsForSelectedLicence.find(x => x.id === selectedCondition), 'notes', 'None')
  } else {
    return 'None'
  }
}

const deduceRestrictionTypeFromUnit = unit => {
  const flowUnits = ['Ml/d', 'm3/s', 'm3/d', 'l/s']
  if (flowUnits.includes(unit)) {
    return 'flow'
  }
  return 'level'
}

const createTitle = station =>
  !station.riverName ? `${station.label}` : `${station.riverName} at ${station.label}`

const mapAbstractionPeriods = input => input.map(licence => ({
  licenceRef: licence.licenceRef,
  licenceId: licence.licenceId,
  linkages: licence.linkages.length > 0
    ? licence.linkages.map(eachLink => {
      const abstractionPeriod = {
        startDay: eachLink.abstractionPeriodStartDay,
        startMonth: eachLink.abstractionPeriodStartMonth,
        endDay: eachLink.abstractionPeriodEndDay,
        endMonth: eachLink.abstractionPeriodEndMonth
      }
      return { ...eachLink, abstractionPeriod }
    })
    : []
}))

const groupByLicence = inputArray => {
  const output = chain(inputArray).groupBy('licenceId').map((value, key) => ({
    licenceRef: value[0].licenceRef,
    licenceId: value[0].licenceId,
    linkages: value
  })).value()

  return mapAbstractionPeriods(output)
}

const handlePost = async request => {
  const { gaugingStationId } = request.params
  const sessionData = session.get(request)

  const { id: licenceId } = sessionData.fetchedLicence
  const storedLicenceVersionPurposeConditionIdFromSession = get(sessionData, 'condition.value', null)
  const licenceVersionPurposeConditionId = storedLicenceVersionPurposeConditionIdFromSession === blankGuid ? null : storedLicenceVersionPurposeConditionIdFromSession
  const thresholdValue = get(sessionData, 'threshold.value')
  const thresholdUnit = get(sessionData, 'unit.value')
  const startDate = get(sessionData, 'startDate.value')
  const startDay = startDate ? startDate.split('-')[1] : null
  const startMonth = startDate ? startDate.split('-')[0] : null
  const endDate = get(sessionData, 'endDate.value')
  const endDay = endDate ? endDate.split('-')[1] : null
  const endMonth = endDate ? endDate.split('-')[0] : null
  const restrictionType = deduceRestrictionTypeFromUnit(thresholdUnit)
  const alertType = get(sessionData, 'alertType.value')
  const volumeLimited = get(sessionData, 'volumeLimited.value')
  const reductionAlertType = volumeLimited === true ? 'stop_or_reduce' : 'reduce'
  const derivedAlertType = alertType === 'stop' ? 'stop' : reductionAlertType

  const parsedPayload = {
    thresholdUnit,
    thresholdValue,
    restrictionType,
    licenceVersionPurposeConditionId,
    abstractionPeriod: {
      startDay: parseInt(startDay),
      startMonth: parseInt(startMonth),
      endDay: parseInt(endDay),
      endMonth: parseInt(endMonth)
    },
    alertType: derivedAlertType
  }

  // If the LVPC ID is supplied, the abstraction period is omitted.
  if (licenceVersionPurposeConditionId) {
    return services.water.gaugingStations.postLicenceLinkage(gaugingStationId, licenceId, omit(parsedPayload, ['abstractionPeriod']))
  }
  return services.water.gaugingStations.postLicenceLinkage(gaugingStationId, licenceId, set(parsedPayload, 'licenceVersionPurposeConditionId', null))
}

const handleRemovePost = async request => {
  const sessionData = session.get(request)
  const removeList = []
  if (!sessionData.selected) {
    return Promise.all([])
  }
  sessionData.selected.forEach(item => {
    if (item.linkages && item.linkages.length) {
      item.linkages.forEach(linkItem => removeList.push(linkItem.licenceGaugingStationId))
    } else {
      removeList.push(item.licenceGaugingStationId)
    }
  })
  if (removeList.length) {
    return Promise.all(removeList.map(licenceGaugingStationId => services.water.gaugingStations.postLicenceLinkageRemove(licenceGaugingStationId)))
  }
  return Promise.all([])
}

const longFormDictionary = [
  { dbitem: 'gal', translation: 'Gallons', context: 'Units' },
  { dbitem: 'Ml/d', translation: 'Megalitres per day', context: 'Units' },
  { dbitem: 'm³', translation: 'Cubic metres', context: 'Units' },
  { dbitem: 'l/d', translation: 'Litres per day', context: 'Units' },
  { dbitem: 'mAOD', translation: 'Ordnance datum (mAOD)', context: 'Units' },
  { dbitem: 'stop_or_reduce', translation: 'Reduce', context: 'AlertType' },
  { dbitem: 'stop', translation: 'Stop', context: 'AlertType' },
  { dbitem: 'reduce', translation: 'Reduce', context: 'AlertType' },
  { dbitem: 'SLD', translation: 'South Level Datum', context: 'Units' }
]

/* Converts database representation into description of tags, e.g. Stop at 115 Megalitres per day */
const toLongForm = (str, context = '') => {
  if (str) {
    const words = str.split(' ')
    const firstMatch = 0
    let dictionarySubset = longFormDictionary.filter(dict => dict.context.toUpperCase() === context.toUpperCase().trim())
    if (!dictionarySubset.length) {
      dictionarySubset = longFormDictionary
    }
    const translated = words.map(word =>
      dictionarySubset.filter(dict => dict.dbitem.toUpperCase() === word.toUpperCase().trim())[firstMatch])
    if (translated[firstMatch]) {
      return translated[firstMatch].translation
    }
  }
  return str
}

const isSelectedCheckbox = (licenceGaugingStationId, selectionArray) => {
  if (!selectionArray) {
    return false
  }
  return selectionArray.filter(chkItem => chkItem === licenceGaugingStationId).length > 0
}

const selectedConditionWithLinkages = request => {
  const { licenceGaugingStations } = request.pre
  const { data } = licenceGaugingStations
  let checkBoxSelection = []
  if (session.get(request).selectedCondition === undefined) {
    return checkBoxSelection
  }
  checkBoxSelection = session.get(request).selectedCondition.value

  const dataFormatted = data.map(item => ({
    licenceGaugingStationId: item.licenceGaugingStationId,
    licenceId: item.licenceId,
    licenceRef: item.licenceRef,
    alertType: item.alertType,
    thresholdValue: item.thresholdValue,
    thresholdUnit: toLongForm(item.thresholdUnit, 'Units')
  })
  )

  const output = chain(dataFormatted).groupBy('licenceId').map(value => ({
    licenceRef: value[0].licenceRef,
    licenceId: value[0].licenceId,
    linkages: value.length <= 0 ? [] : value.filter(itemInLinkages => isSelectedCheckbox(itemInLinkages.licenceGaugingStationId, checkBoxSelection))
  })).value()

  return output.filter(chkItem => chkItem.linkages.length > 0)
}

const addCheckboxFields = dataWithoutDistinct =>
  dataWithoutDistinct.map(itemWithoutDistinct => ({
    value: itemWithoutDistinct.licenceGaugingStationId,
    licenceGaugingStationId: itemWithoutDistinct.licenceGaugingStationId,
    licenceId: itemWithoutDistinct.licenceId,
    licenceRef: itemWithoutDistinct.licenceRef,
    label: ` ${toLongForm(itemWithoutDistinct.alertType, 'AlertType')} at ${itemWithoutDistinct.thresholdValue} ${toLongForm(itemWithoutDistinct.thresholdUnit, 'Units')}`,
    hint: itemWithoutDistinct.licenceRef,
    alertType: itemWithoutDistinct.alertType,
    thresholdValue: itemWithoutDistinct.thresholdValue,
    thresholdUnit: toLongForm(itemWithoutDistinct.thresholdUnit, 'Units')
  })
  )

const groupLicenceConditions = request => {
  const { licenceGaugingStations } = request.pre
  const { data } = licenceGaugingStations

  return chain(data).groupBy('licenceId').map(value => ({
    licenceRef: value[0].licenceRef,
    licenceId: value[0].licenceId,
    licenceGaugingStationId: value[0].licenceGaugingStationId,
    alertType: value[0].alertType,
    thresholdValue: value[0].thresholdValue,
    thresholdUnit: value[0].thresholdUnit,
    linkages: value
  })).value()
}

const getBatchAlertData = async request => {
  const { selectedGroupedLicences, sendingAlertType } = session.get(request)

  return {
    sendingAlertType: sendingAlertType.value,
    linkages: selectedGroupedLicences.map(n => n.map(m => ({
      licenceGaugingStationId: m.licenceGaugingStationId,
      licenceId: m.licenceId,
      abstractionPeriodStartDay: m.abstractionPeriodStartDay,
      abstractionPeriodStartMonth: m.abstractionPeriodStartMonth,
      abstractionPeriodEndDay: m.abstractionPeriodEndDay,
      abstractionPeriodEndMonth: m.abstractionPeriodEndMonth,
      restrictionType: m.restrictionType,
      alertType: m.alertType,
      thresholdValue: m.thresholdValue,
      thresholdUnit: m.thresholdUnit,
      licenceVersionPurposeConditionId: m.licenceVersionPurposeConditionId,
      licenceRef: m.licenceRef,
      label: m.label
    })))
  }
}

const getIssuer = async request => {
  const { customEmailAddress, useLoggedInUserEmailAddress } = await session.get(request)
  return useLoggedInUserEmailAddress.value === true ? request.defra.userName : customEmailAddress.value
}

exports.blankGuid = blankGuid
exports.createTitle = createTitle
exports.redirectTo = redirectTo
exports.isLicenceNumberValid = isLicenceNumberValid
exports.fetchConditionsForLicence = fetchConditionsForLicence
exports.getCaption = getCaption
exports.getSelectedConditionText = getSelectedConditionText
exports.groupByLicence = groupByLicence
exports.handlePost = handlePost
exports.handleRemovePost = handleRemovePost
exports.toLongForm = toLongForm
exports.selectedConditionWithLinkages = selectedConditionWithLinkages
exports.groupLicenceConditions = groupLicenceConditions
exports.addCheckboxFields = addCheckboxFields
exports.isSelectedCheckbox = isSelectedCheckbox
exports.deduceRestrictionTypeFromUnit = deduceRestrictionTypeFromUnit
exports.getBatchAlertData = getBatchAlertData
exports.getIssuer = getIssuer

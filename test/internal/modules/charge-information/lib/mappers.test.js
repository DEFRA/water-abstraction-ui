'use strict'

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const { flattenAdditionalChargesProperties } = require('internal/modules/charge-information/lib/mappers')

experiment('internal/modules/charge-information/lib/mappers', () => {
  experiment('flattenAdditionalChargesProperties', () => {
    test('no additional charges are flattened', () => {
      const chargeElement = {}
      const result = flattenAdditionalChargesProperties(chargeElement)
      expect(result).to.equal({})
    })

    test('Additional charges are flattened', () => {
      const id = 'ID'
      const name = 'NAME'
      const chargeElement = { additionalCharges: { supportedSource: { id, name }, isSupplyPublicWater: true } }
      const result = flattenAdditionalChargesProperties(chargeElement)
      expect(result).to.equal({
        isAdditionalCharges: true,
        isSupportedSource: true,
        isSupplyPublicWater: true,
        supportedSourceId: id,
        supportedSourceName: name
      })
    })
  })
})

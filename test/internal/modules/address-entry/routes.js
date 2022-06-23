'use strict'
const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { scope } = require('internal/lib/constants')
const routes = require('internal/modules/address-entry/routes')

experiment('internal/modules/address-entry/routes', () => {
  experiment('.getPostcode', () => {
    test('limits scope to users with billing or manage billing accounts roles', async () => {
      expect(routes.getPostcode.options.auth.scope)
        .to.only.include([scope.billing, scope.manageBillingAccounts])
    })
  })

  experiment('.postSelectAddress', () => {
    test('limits scope to users with billing or manage billing accounts roles', async () => {
      expect(routes.postSelectAddress.options.auth.scope)
        .to.only.include([scope.billing, scope.manageBillingAccounts])
    })
  })

  experiment('.getManualAddressEntry', () => {
    test('limits scope to users with billing or manage billing accounts roles', async () => {
      expect(routes.getManualAddressEntry.options.auth.scope)
        .to.only.include([scope.billing, scope.manageBillingAccounts])
    })
  })

  experiment('.postManualAddressEntry', () => {
    test('limits scope to users with billing or manage billing accounts roles', async () => {
      expect(routes.postManualAddressEntry.options.auth.scope)
        .to.only.include([scope.billing, scope.manageBillingAccounts])
    })
  })
})

const sinon = require('sinon')
const { expect, fail } = require('@hapi/code')
const { experiment, test, beforeEach } = (exports.lab = require('@hapi/lab').script())
const { redirectToBillingAccount } = require('internal/modules/internal-search/lib/redirect-to-billing-account')

experiment('redirectToBillingAccount', () => {
  const billingAccount = {
    invoiceAccountId: 'some-guid'
  }
  const h = {}

  beforeEach(() => {
    h.redirect = sinon.stub()
  })

  test('It should throw a 404 error if the billing ID does not exist', async () => {
    const view = {}

    try {
      redirectToBillingAccount({
        invoiceAccountId: null
      }, view, h)
      fail('Should not get here')
    } catch (err) {
      expect(err.isBoom).to.be.true()
      expect(err.output.statusCode).to.equal(404)
    }
  })

  test('It should redirect if the return has a path property', async () => {
    const view = {
      billingAccount
    }
    redirectToBillingAccount(billingAccount, view, h)
    expect(h.redirect.firstCall.args[0]).to.equal(`/system/billing-accounts/${view.billingAccount.invoiceAccountId}`)
  })
})

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { getAnalyticsCookieDomain } = require('shared/plugins/cookie-message/lib/cookie-domain')

experiment('plugins/cookie-message/lib/cookie-domain', () => {
  test('leaves localhost unchanged', () => {
    expect(getAnalyticsCookieDomain('localhost'))
      .to.equal('localhost')
  })

  test('works on subdomains', () => {
    expect(getAnalyticsCookieDomain('some.example.defra.cloud'))
      .to.equal('.defra.cloud')
  })

  test('works on production domain', () => {
    expect(getAnalyticsCookieDomain('manage-water-abstraction-impoundment-licence.service.gov.uk'))
      .to.equal('.manage-water-abstraction-impoundment-licence.service.gov.uk')
  })

  test('works on production sub-domain', () => {
    expect(getAnalyticsCookieDomain('subdomain.manage-water-abstraction-impoundment-licence.service.gov.uk'))
      .to.equal('.manage-water-abstraction-impoundment-licence.service.gov.uk')
  })
})

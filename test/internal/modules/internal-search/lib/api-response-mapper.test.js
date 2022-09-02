const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { mapResponseToView } = require('internal/modules/internal-search/lib/api-response-mapper')
const { scope } = require('internal/lib/constants')

experiment('mapResponseToView', () => {
  const request = {
    auth: {
      credentials: {
        scope: scope.internal
      }
    }
  }

  test('noResults should be set if there are no licence, return or user results', async () => {
    const result = mapResponseToView({}, request)
    expect(result.noResults).to.equal(true)
  })

  test('Documents should be passed through unchanged if present', async () => {
    const documents = [{ documentId: 'abc' }]
    const result = mapResponseToView({ documents }, request)
    expect(result.documents).to.equal(documents)
  })

  test('Users should be passed through unchanged if present', async () => {
    const users = [{ userId: 123 }]
    const result = mapResponseToView({ users }, request)
    expect(result.users).to.equal(users)
  })

  test('Returns should be mapped and returned if present', async () => {
    const returns = [{ return_id: 'v1:8:1234', status: 'completed' }]

    const { returns: [ret] } = mapResponseToView({ returns }, request)

    expect(ret.return_id).to.equal(returns[0].return_id)
    expect(ret.badge).to.be.an.object()
    expect(ret.path).to.be.a.string()
    expect(ret.isEdit).to.be.a.boolean()
  })
})

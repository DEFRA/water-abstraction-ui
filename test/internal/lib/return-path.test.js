'use strict'

const Lab = require('@hapi/lab')
const { experiment, test } = (exports.lab = Lab.script())
const { expect } = require('@hapi/code')

const ReturnPath = require('internal/lib/return-path')

const { scope } = require('internal/lib/constants')

const ret = {
  id: 'da394471-0928-4544-8960-fed2087d1ea7',
  return_id: 'v1:123:456',
  received_date: '2018-11-08',
  status: 'completed',
  end_date: '2018-10-31'
}

const internalEdit = `/return/internal?returnId=${ret.return_id}`

const getInternalRequest = (isEditor = false) => {
  const scopes = isEditor ? [scope.internal, scope.returns] : [scope.internal]
  return {
    auth: {
      credentials: {
        scope: scopes
      }
    }
  }
}

experiment('return-path', () => {
  experiment('#getReturnPath()', () => {
    test('An internal user can view/edit a return', async () => {
      const request = getInternalRequest()
      expect(ReturnPath.getReturnPath(ret, request)).to.equal({
        path: `/system/return-logs/${ret.id}`,
        isEdit: false
      })
    })
  })

  experiment('#getEditButtonPath()', () => {
    test('An internal user cannot see the edit return button', async () => {
      const request = getInternalRequest()
      expect(ReturnPath.getEditButtonPath(ret, request)).to.equal(undefined)
    })

    test('An internal returns user cannot see the edit return button if isInternalEdit is false', async () => {
      const request = getInternalRequest(true)
      expect(ReturnPath.getEditButtonPath({ ...ret, status: 'void' }, request)).to.equal(undefined)
    })

    test('An internal returns user can see the edit return button if isInternalEdit is true', async () => {
      const request = getInternalRequest(true)
      expect(ReturnPath.getEditButtonPath(ret, request)).to.equal(internalEdit)
    })
  })

  experiment('#isInternalEdit()', () => {
    test('An internal user cannot see the edit return button', async () => {
      const request = getInternalRequest()
      expect(ReturnPath.isInternalEdit(ret, request)).to.equal(false)
    })

    test('An internal returns user cannot edit a return if it has void status', async () => {
      const request = getInternalRequest(true)
      expect(ReturnPath.isInternalEdit({ ...ret, status: 'void' }, request)).to.equal(false)
    })

    test('An internal returns user cannot edit a return if the end date is before Summer 2018', async () => {
      const request = getInternalRequest(true)
      expect(ReturnPath.isInternalEdit({ ...ret, end_date: '2018-10-30' }, request)).to.equal(false)
    })

    test('An internal returns user cannot edit a return if it the end date has not passed', async () => {
      const request = getInternalRequest(true)
      expect(ReturnPath.isInternalEdit({ ...ret, end_date: '3000-01-01' }, request)).to.equal(false)
    })

    test('An internal returns user can edit a return if it has completed status', async () => {
      const request = getInternalRequest(true)
      expect(ReturnPath.isInternalEdit({ ...ret, status: 'completed' }, request)).to.equal(true)
    })
  })
})

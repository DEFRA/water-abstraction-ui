'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { sortNewDirection } = require('shared/view/nunjucks/filters/sort-new-direction')

experiment('Nunjucks filters: sortNewDirection', () => {
  test('sets the new direction to -1 if the field is currently being sorted', async () => {
    const query = {
      direction: 1,
      sort: 'test-field'
    }

    const newDirection = sortNewDirection(query, 'test-field')
    expect(newDirection).to.equal(-1)
  })

  test('sets the new direction to 1 if the field is not being sorted', async () => {
    const query = {
      direction: -1,
      sort: 'test-field'
    }

    const newDirection = sortNewDirection(query, 'test-field')
    expect(newDirection).to.equal(1)
  })

  test('sets the new direction to 1 if the field is not currently being sorted', async () => {
    const query = {
      direction: -1,
      sort: 'test-field'
    }

    const newDirection = sortNewDirection(query, 'another-field')
    expect(newDirection).to.equal(1)
  })
})

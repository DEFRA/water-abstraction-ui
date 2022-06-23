const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()
const { filter } = require('lodash')
const { form: quantitiesForm } = require('external/modules/returns/forms/quantities')

const createRequest = () => {
  return {
    view: {
      csrfToken: 'test-csrf-token'
    },
    query: {
      returnId: 'test-return-id'
    },
    auth: {
      credentials: {
        scope: 'external'
      }
    }
  }
}

const createReturn = (type = 'measured') => {
  return {
    reading: {
      units: 'l',
      type
    },

    lines: [],
    requiredLines: [
      {
        startDate: '20190101',
        endDate: '20190102',
        timePeriod: 'day'
      },
      {
        startDate: '20190102',
        endDate: '20190103',
        timePeriod: 'day'
      }
    ]
  }
}
const isParagraph = (field) => {
  return field.options.widget === 'paragraph'
}

experiment('quantitiesForm', () => {
  const expectedText = 'Remember if you have a ×10 meter you need to multiply your volumes.'
  const internalExpectedText = ['Volumes entered should be calculated manually.', 'Take into consideration the ×10 display.']

  test('adds help text about ×10 meters if external and measured volumes', async () => {
    const form = quantitiesForm(createRequest(), createReturn())
    const text = filter(form.fields, isParagraph).map(row => row.options.text)
    expect(text).to.include(expectedText)
  })

  test('does not add help text about ×10 meters if estimated volumes', async () => {
    const form = quantitiesForm(createRequest(), createReturn('estimated'))
    const text = filter(form.fields, isParagraph).map(row => row.options.text)
    expect(text).to.not.include(expectedText)
  })

  test('does not add internal help text for external users', async () => {
    const form = quantitiesForm(createRequest(), createReturn())
    const text = filter(form.fields, isParagraph).map(row => row.options.text)
    expect(text).to.not.include(internalExpectedText[0])
    expect(text).to.not.include(internalExpectedText[1])
  })

  test('adds inputs for each line', async () => {
    const form = quantitiesForm(createRequest(), createReturn())
    const inputs = filter(form.fields, field => {
      return field.options.widget === 'text' &&
        field.name !== 'csrf_token'
    })

    expect(inputs.length).to.equal(2)
  })

  test('adds autofocus to the first input', async () => {
    const form = quantitiesForm(createRequest(), createReturn())
    const inputs = filter(form.fields, field => {
      return field.options.widget === 'text' &&
        field.name !== 'csrf_token'
    })

    expect(inputs[0].options.attr.autofocus).to.be.true()
    expect(inputs[1].options.attr.autofocus).to.be.undefined()
  })
})

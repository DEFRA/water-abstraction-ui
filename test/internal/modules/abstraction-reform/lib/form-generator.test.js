'use strict'

require('dotenv').config()
const sandbox = require('sinon').createSandbox()
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script()

const {
  dereference,
  schemaToForm,
  guessLabel,
  addAttribute,
  createEnumField
} = require('internal/modules/abstraction-reform/lib/form-generator')
const { expect } = require('@hapi/code')
const services = require('internal/lib/connectors/services')

const conditionsResponse = {
  error: null,
  data: [
    {
      purposeText: 'Purpose Text 1',
      id: 'id-1',
      code: 'AGG',
      subCode: 'PP',
      text: 'Text-1',
      parameter1: 'Parameter1-1',
      parameter2: 'Parameter2-1'
    },
    {
      purposeText: 'Purpose Text 2',
      id: 'id-2',
      code: 'COMP',
      subCode: 'GEN',
      text: 'Text-2',
      parameter1: 'Parameter1-2',
      parameter2: 'Parameter2-2'
    }
  ]
}

const pointsResponse = {
  error: null,
  data: [
    { id: 1, name: 'Point 1' },
    { id: 2, name: 'Point 2' }
  ]
}

const data = require('./picklist-data.json')

experiment('.dereference', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      ngr: { $ref: 'water://types/ngr.json' }
    }
  }

  test('de-references the referenced types', async () => {
    const result = await dereference(schema)

    expect(result.properties.ngr.type).to.equal('string')
    expect(result.properties.ngr.pattern).to.be.a.string()
  })
})

experiment('Test schema to form creation', () => {
  const schema = {
    type: 'object',
    properties: {
      choice: { type: 'string', enum: data.noId.items.map(item => item.value) },
      object_choice: { type: 'object', enum: data.withId.items },
      string: { type: 'string' },
      number: { type: 'number' },
      boolean: { type: 'boolean' }
    }
  }

  test('It should create a form object from a JSON schema', async () => {
    const request = {
      params: {
        documentId: '0fa2d972-3a7e-49db-bb13-cba109dc0299',
        schema: 'some/schema'
      },
      view: {
        csrfToken: 'c06dd128-4486-4775-801f-13ed022ae811'
      }
    }
    const form = schemaToForm('/action', request, schema)

    const fields = ['csrf_token', 'choice', 'object_choice', 'string', 'number', 'boolean', null]

    expect(form.action).to.equal('/action')
    expect(form.fields.map(item => item.name)).to.equal(fields)
    expect(form.validationType).to.equal('jsonSchema')
  })
})

experiment('Test guessLabel', () => {
  test('It should generate a human-readable label given a snake case fieldname', async () => {
    const str = guessLabel('some_test__name', {})
    expect(str).to.equal('Some test name')
  })

  test('It should use a label if one is specified', async () => {
    const str = guessLabel('some_test__name', { label: 'A label' })
    expect(str).to.equal('A label')
  })
})

experiment('dereference can resolve licence conditions', () => {
  let schema
  let context
  let populated

  beforeEach(async () => {
    sandbox.stub(services.water.licences, 'getConditionsByDocumentId').resolves(conditionsResponse)

    schema = {
      type: 'object',
      properties: {
        conditions: { $ref: 'water://licences/conditions.json' }
      }
    }

    context = { documentId: 'test-id' }
    populated = await dereference(schema, context)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('the document id is used to make the call to get the conditions', async () => {
    const arg = services.water.licences.getConditionsByDocumentId.getCall(0).args[0]
    expect(arg).to.equal('test-id')
  })

  test('ref is replaced with the conditions data', async () => {
    expect(populated).to.equal({
      type: 'object',
      properties: {
        conditions: {
          type: 'object',
          defaultEmpty: true,
          enum: [
            { id: 'id-1', value: 'id-1: Aggregate condition purpose to purpose within a licence' },
            { id: 'id-2', value: 'id-2: Complex condition' }
          ]
        }
      }
    })
  })
})

experiment('dereference can resolve licence points', () => {
  let schema
  let context
  let populated

  beforeEach(async () => {
    sandbox.stub(services.water.licences, 'getPointsByDocumentId').resolves(pointsResponse)

    schema = {
      type: 'object',
      properties: {
        points: { $ref: 'water://licences/points.json' }
      }
    }

    context = { documentId: 'test-id' }
    populated = await dereference(schema, context)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('the document id is used to make the call to get the points', async () => {
    const arg = services.water.licences.getPointsByDocumentId.getCall(0).args[0]
    expect(arg).to.equal('test-id')
  })

  test('ref is replaced with the points data', async () => {
    expect(populated).to.equal({
      type: 'object',
      properties: {
        points: {
          type: 'object',
          defaultEmpty: true,
          enum: [
            { id: 1, value: 'Point 1' },
            { id: 2, value: 'Point 2' }
          ]
        }
      }
    })
  })
})

experiment('addAttribute should add one or more attribute properties to field object', () => {
  const field = {
    options: {

    }
  }

  test('It adds a string attribute', async () => {
    const f = addAttribute(field, 'foo', 'bar')
    expect(f.options.attr.foo).to.equal('bar')
  })

  test('It adds a number attribute', async () => {
    const f = addAttribute(field, 'foo', 1)
    expect(f.options.attr.foo).to.equal('1')
  })

  test('It JSON stringifies object attributes', async () => {
    const f = addAttribute(field, 'foo', { bar: 'baz' })
    expect(f.options.attr.foo).to.equal('{"bar":"baz"}')
  })

  test('It merges multiple attributes', async () => {
    let f = field
    f = addAttribute(f, 'foo', 1)
    f = addAttribute(f, 'bar', 'baz')
    expect(f.options.attr.foo).to.equal('1')
    expect(f.options.attr.bar).to.equal('baz')
  })
})

experiment('createEnumField', () => {
  test('for 5 enum values, a radio group is created', async () => {
    const item = {
      enum: [1, 2, 3, 4, 5]
    }

    const field = createEnumField('name-of-field', item)
    expect(field.options.widget).to.equal('radio')
  })

  test('for > 5 enum values, a dropdown is created', async () => {
    const item = {
      enum: [1, 2, 3, 4, 5, 6]
    }

    const field = createEnumField('name-of-field', item)
    expect(field.options.widget).to.equal('dropdown')
  })

  test('for 5 enum values, and defaultEmpty set to true, there are still only 5 entries', async () => {
    const item = {
      enum: [1, 2, 3, 4, 5],
      defaultEmpty: true
    }

    const field = createEnumField('name-of-field', item)
    expect(field.options.choices.length).to.equal(5)
  })

  test('for > 5 scalar enum values, and defaultEmpty set to true, an empty values is added to choices', async () => {
    const item = {
      enum: [1, 2, 3, 4, 5, 6],
      defaultEmpty: true
    }

    const field = createEnumField('name-of-field', item)
    expect(field.options.choices.length).to.equal(7)
    expect(field.options.choices[0]).to.equal({ value: '', label: '' })
  })

  test('for > 5 object enum values, and defaultEmpty set to true, an empty values is added to choices', async () => {
    const item = {
      enum: [1, 2, 3, 4, 5, 6].map(i => ({ label: i, value: i })),
      defaultEmpty: true
    }

    const field = createEnumField('name-of-field', item)
    expect(field.options.choices.length).to.equal(7)
    expect(field.options.choices[0]).to.equal({ value: '', label: '' })
  })
})

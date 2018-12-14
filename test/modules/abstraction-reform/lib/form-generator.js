require('dotenv').config();
const sandbox = require('sinon').createSandbox();

const apiHelpers = require('../../../../src/modules/abstraction-reform/lib/api-helpers');
const { dereference, picklistSchemaFactory, schemaToForm, guessLabel } = require('../../../../src/modules/abstraction-reform/lib/form-generator');
const { expect } = require('code');
const licencesConnector = require('../../../../src/lib/connectors/water-service/licences');

const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();

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
};

const pointsResponse = {
  error: null,
  data: [
    { id: 1, name: 'Point 1' },
    { id: 2, name: 'Point 2' }
  ]
};

const data = {
  noId: {
    picklist: { id_required: false },
    items: [
      { value: 'Red' },
      { value: 'Yellow' },
      { value: 'Blue' }
    ]
  },
  withId: {
    picklist: { id_required: true },
    items: [
      { id: 'r', value: 'Red' },
      { id: 'y', value: 'Yellow' },
      { id: 'b', value: 'Blue' }
    ]
  }
};

experiment('Test picklistSchemaFactory', () => {
  test('It should generate a schema for picklists without IDs', async () => {
    const { picklist, items } = data.noId;
    const schema = picklistSchemaFactory(picklist, items);
    expect(schema).to.equal({ type: 'string', enum: [ 'Red', 'Yellow', 'Blue' ] });
  });

  test('It should generate a schema for picklists with IDs', async () => {
    const { picklist, items } = data.withId;
    const schema = picklistSchemaFactory(picklist, items);

    expect(schema).to.equal(
      { type: 'object',
        enum: [
          { id: 'r', value: 'Red' },
          { id: 'y', value: 'Yellow' },
          { id: 'b', value: 'Blue' }
        ]
      }
    );
  });
});

experiment('Test dereference', () => {
  beforeEach(async () => {
    sandbox.stub(apiHelpers, 'getPicklist').resolves(data.noId.picklist);
    sandbox.stub(apiHelpers, 'getPicklistItems').resolves(data.noId.items);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      items: { $ref: 'water://picklists/some_ref.json' },
      ngr: { $ref: 'water://types/ngr.json' }
    }
  };

  test('It should de-reference referenced picklists and types', async () => {
    const result = await dereference(schema);

    expect(result).to.equal({
      'type': 'object',
      'properties': {
        'name': {
          'type': 'string'
        },
        'items': {
          'type': 'string',
          'enum': [
            'Red',
            'Yellow',
            'Blue'
          ]
        },
        'ngr': {
          'type': 'string',
          'pattern': '/^[S][STWXY](\\d{4}|\\d{6}|\\d{8}|\\d{10})$/'
        }
      }
    });
  });
});

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
  };

  test('It should create a form object from a JSON schema', async () => {
    const form = schemaToForm('/some/action', schema);

    expect(form).to.equal({
      action: '/some/action',
      method: 'POST',
      isSubmitted: false,
      fields: [
        {
          name: 'choice',
          options: {
            choices: [ 'Red', 'Yellow', 'Blue' ],
            label: 'Choice',
            widget: 'radio',
            required: true,
            mapper: 'defaultMapper'
          },
          errors: [],
          value: undefined
        },
        {
          name: 'object_choice',
          options: {
            choices: [
              { id: 'r', value: 'Red' },
              { id: 'y', value: 'Yellow' },
              { id: 'b', value: 'Blue' }
            ],
            label: 'Object choice',
            widget: 'radio',
            required: true,
            key: 'id',
            mapper: 'objectMapper'
          },
          errors: [],
          value: undefined
        },
        {
          name: 'string',
          options: {
            label: 'String',
            widget: 'text',
            required: true,
            type: 'text',
            controlClass: 'form-control',
            autoComplete: true,
            mapper: 'defaultMapper'
          },
          errors: [],
          value: undefined
        },
        {
          name: 'number',
          options: {
            label: 'Number',
            widget: 'text',
            required: true,
            type: 'text',
            controlClass: 'form-control',
            autoComplete: true,
            mapper: 'numberMapper'
          },
          errors: [],
          value: undefined
        },
        {
          name: 'boolean',
          options: {
            choices: [
              { value: false, label: 'Yes' },
              { value: true, label: 'No' }
            ],
            label: 'Boolean',
            widget: 'radio',
            required: true,
            mapper: 'booleanMapper'
          },
          errors: [],
          value: undefined
        },
        {
          name: null,
          options: { widget: 'button', label: 'Submit' },
          value: undefined
        }
      ],
      isValid: undefined,
      errors: [],
      validationType: 'json-schema'
    });
  });
});

experiment('Test guessLabel', () => {
  test('It should generate a human-readable label given a snake case fieldname', async () => {
    const str = guessLabel('some_test__name');
    expect(str).to.equal('Some test name');
  });
});

experiment('dereference can resolve licence conditions', () => {
  let schema;
  let context;
  let populated;

  beforeEach(async () => {
    sandbox.stub(licencesConnector, 'getLicenceConditionsByDocumentId').resolves(conditionsResponse);

    schema = {
      type: 'object',
      properties: {
        conditions: { $ref: 'water://licences/conditions.json' }
      }
    };

    context = { documentId: 'test-id' };
    populated = await dereference(schema, context);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the document id is used to make the call to get the conditions', async () => {
    const arg = licencesConnector.getLicenceConditionsByDocumentId.getCall(0).args[0];
    expect(arg).to.equal('test-id');
  });

  test('ref is replaced with the conditions data', async () => {
    expect(populated).to.equal({
      type: 'object',
      properties: {
        conditions: {
          type: 'object',
          enum: [
            { id: 'id-1', value: 'Text-1' },
            { id: 'id-2', value: 'Text-2' }
          ]
        }
      }
    });
  });
});

experiment('dereference can resolve licence points', () => {
  let schema;
  let context;
  let populated;

  beforeEach(async () => {
    sandbox.stub(licencesConnector, 'getLicencePointsByDocumentId').resolves(pointsResponse);

    schema = {
      type: 'object',
      properties: {
        points: { $ref: 'water://licences/points.json' }
      }
    };

    context = { documentId: 'test-id' };
    populated = await dereference(schema, context);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the document id is used to make the call to get the points', async () => {
    const arg = licencesConnector.getLicencePointsByDocumentId.getCall(0).args[0];
    expect(arg).to.equal('test-id');
  });

  test('ref is replaced with the points data', async () => {
    expect(populated).to.equal({
      type: 'object',
      properties: {
        points: {
          type: 'object',
          enum: [
            { id: 1, value: 'Point 1' },
            { id: 2, value: 'Point 2' }
          ]
        }
      }
    });
  });
});

require('dotenv').config();
const sandbox = require('sinon').createSandbox();

const apiHelpers = require('../../../../src/modules/abstraction-reform/lib/api-helpers');
const {
  dereference, picklistSchemaFactory, schemaToForm, guessLabel, addAttribute
} = require('../../../../src/modules/abstraction-reform/lib/form-generator');
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

const data = require('./picklist-data.json');

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

    expect(result.properties.ngr.type).to.equal('string');
    expect(result.properties.ngr.pattern).to.be.a.string();
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
    const request = {
      params: {
        documentId: '0fa2d972-3a7e-49db-bb13-cba109dc0299',
        schema: 'some/schema'
      },
      view: {
        csrfToken: 'c06dd128-4486-4775-801f-13ed022ae811'
      }
    };
    const form = schemaToForm('/action', request, schema);

    const fields = ['csrf_token', 'choice', 'object_choice', 'string', 'number', 'boolean', null];

    expect(form.action).to.equal('/action');
    expect(form.fields.map(item => item.name)).to.equal(fields);
    expect(form.validationType).to.equal('jsonSchema');
  });
});

experiment('Test guessLabel', () => {
  test('It should generate a human-readable label given a snake case fieldname', async () => {
    const str = guessLabel('some_test__name', {});
    expect(str).to.equal('Some test name');
  });

  test('It should use a label if one is specified', async () => {
    const str = guessLabel('some_test__name', { ui: { label: 'A label' } });
    expect(str).to.equal('A label');
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

experiment('addAttribute should add one or more attribute properties to field object', () => {
  const field = {
    options: {

    }
  };

  test('It adds a string attribute', async () => {
    const f = addAttribute(field, 'foo', 'bar');
    expect(f.options.attr.foo).to.equal('bar');
  });

  test('It adds a number attribute', async () => {
    const f = addAttribute(field, 'foo', 1);
    expect(f.options.attr.foo).to.equal('1');
  });

  test('It JSON stringifies object attributes', async () => {
    const f = addAttribute(field, 'foo', { bar: 'baz' });
    expect(f.options.attr.foo).to.equal('{"bar":"baz"}');
  });

  test('It merges multiple attributes', async () => {
    let f = field;
    f = addAttribute(f, 'foo', 1);
    f = addAttribute(f, 'bar', 'baz');
    expect(f.options.attr.foo).to.equal('1');
    expect(f.options.attr.bar).to.equal('baz');
  });
});

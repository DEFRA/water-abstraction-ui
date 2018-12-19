require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');
const sinon = require('sinon');

const apiHelpers = require('../../../../src/modules/abstraction-reform/lib/api-helpers');
const { dereference, picklistSchemaFactory, schemaToForm, guessLabel } = require('../../../../src/modules/abstraction-reform/lib/form-generator');

const lab = exports.lab = Lab.script();

const data = require('./picklist-data.json');

lab.experiment('Test picklistSchemaFactory', () => {
  lab.test('It should generate a schema for picklists without IDs', async () => {
    const { picklist, items } = data.noId;
    const schema = picklistSchemaFactory(picklist, items);
    expect(schema).to.equal({ type: 'string', enum: [ 'Red', 'Yellow', 'Blue' ] });
  });

  lab.test('It should generate a schema for picklists with IDs', async () => {
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

lab.experiment('Test dereference', () => {
  let picklistStub, itemsStub;

  lab.before(async () => {
    picklistStub = sinon.stub(apiHelpers, 'getPicklist').resolves(data.noId.picklist);
    itemsStub = sinon.stub(apiHelpers, 'getPicklistItems').resolves(data.noId.items);
  });

  lab.after(async () => {
    picklistStub.restore();
    itemsStub.restore();
  });

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      items: { $ref: 'water://picklists/some_ref.json' },
      ngr: { $ref: 'water://types/ngr.json' }
    }
  };

  lab.test('It should de-reference referenced picklists and types', async () => {
    const result = await dereference(schema);

    expect(result.properties.ngr.type).to.equal('string');
    expect(result.properties.ngr.pattern).to.be.a.string();
  });
});

lab.experiment('Test schema to form creation', () => {
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

  lab.test('It should create a form object from a JSON schema', async () => {
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

lab.experiment('Test guessLabel', () => {
  lab.test('It should generate a human-readable label given a snake case fieldname', async () => {
    const str = guessLabel('some_test__name', {});
    expect(str).to.equal('Some test name');
  });

  lab.test('It should use a label if one is specified', async () => {
    const str = guessLabel('some_test__name', { label: 'A label' });
    expect(str).to.equal('A label');
  });
});

exports.lab = lab;

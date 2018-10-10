require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');
const sinon = require('sinon');

const apiHelpers = require('../../../../src/modules/abstraction-reform/lib/api-helpers');
const { dereference, picklistSchemaFactory, schemaToForm, guessLabel } = require('../../../../src/modules/abstraction-reform/lib/form-generator');

const lab = exports.lab = Lab.script();

const data = {
  noId: {
    picklist: {
      id_required: false
    },
    items: [{
      value: 'Red'
    }, {
      value: 'Yellow'
    }, {
      value: 'Blue'
    }]
  },
  withId: {
    picklist: {
      id_required: true
    },
    items: [{
      id: 'r',
      value: 'Red'
    }, {
      id: 'y',
      value: 'Yellow'
    }, {
      id: 'b',
      value: 'Blue'
    }]
  }
};

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
    const form = schemaToForm('/some/action', schema);

    expect(form).to.equal({
      'action': '/some/action',
      'method': 'POST',
      'isSubmitted': false,
      'fields': [
        {
          'name': 'choice',
          'options': {
            'choices': [
              'Red',
              'Yellow',
              'Blue'
            ],
            'label': 'Choice',
            'widget': 'radio',
            'required': true,
            'mapper': 'defaultMapper'
          },
          'errors': [],
          'value': undefined
        },
        {
          'name': 'object_choice',
          'options': {
            'choices': [
              {
                'id': 'r',
                'value': 'Red'
              },
              {
                'id': 'y',
                'value': 'Yellow'
              },
              {
                'id': 'b',
                'value': 'Blue'
              }
            ],
            'label': 'Object choice',
            'widget': 'radio',
            'required': true,
            'key': 'id',
            'mapper': 'objectMapper'
          },
          'errors': [],
          'value': undefined
        },
        {
          'name': 'string',
          'options': {
            'label': 'String',
            'widget': 'text',
            'required': true,
            'type': 'text',
            'controlClass': 'form-control',
            'autoComplete': true,
            'mapper': 'defaultMapper'
          },
          'errors': [],
          'value': undefined
        },
        {
          'name': 'number',
          'options': {
            'label': 'Number',
            'widget': 'text',
            'required': true,
            'type': 'text',
            'controlClass': 'form-control',
            'autoComplete': true,
            'mapper': 'numberMapper'
          },
          'errors': [],
          'value': undefined
        },
        {
          'name': 'boolean',
          'options': {
            'choices': [
              {
                'value': false,
                'label': 'Yes'
              },
              {
                'value': true,
                'label': 'No'
              }
            ],
            'label': 'Boolean',
            'widget': 'radio',
            'required': true,
            'mapper': 'booleanMapper'
          },
          'errors': [],
          'value': undefined
        },
        {
          'name': null,
          'options': {
            'widget': 'button',
            'label': 'Submit'
          },
          'value': undefined
        }
      ],
      'isValid': undefined,
      'errors': []
    });
  });
});

lab.experiment('Test guessLabel', () => {
  lab.test('It should generate a human-readable label given a snake case fieldname', async () => {
    const str = guessLabel('some_test__name');
    expect(str).to.equal('Some test name');
  });
});

exports.lab = lab;

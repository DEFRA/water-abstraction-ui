const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();
const { meterDetailsForm } = require('../../../../src/modules/returns/forms/meter-details');

const createRequest = (isInternal = true) => {
  return {
    view: {
      csrfToken: 'test-csrf-token',
      isAdmin: true
    },
    query: {
      returnId: 'test-return-id'
    },
    auth: {
      credentials: {
        scope: 'internal'
      }
    }
  };
};

const createReturn = (isMultiplier = false) => {
  return {
    meters: [{ multiplier: isMultiplier ? 10 : 1 }],

    lines: [],
    requiredLines: []
  };
};

experiment('meterDetailsForm', () => {
  test('manufacturer field has the autofocus attribute', async () => {
    const form = meterDetailsForm(createRequest(), createReturn());
    const field = form.fields.find(field => {
      return field.name === 'manufacturer';
    });

    expect(field.options.attr.autofocus).to.be.true();
  });

  test('serial number field does not have the autofocus attribute', async () => {
    const form = meterDetailsForm(createRequest(), createReturn());
    const field = form.fields.find(field => {
      return field.name === 'serialNumber';
    });

    expect(field.options.attr.autofocus).to.be.undefined();
  });

  test('adds the checkbox for a 10x meter', async () => {
    const form = meterDetailsForm(createRequest(), createReturn());
    const field = form.fields.find(field => {
      return field.name === 'isMultiplier';
    });
    expect(field).to.exist();
  });

  test('sets the checkbox as checked for a 10x meter', async () => {
    const form = meterDetailsForm(createRequest(), createReturn(true));
    const field = form.fields.find(field => {
      return field.name === 'isMultiplier';
    });
    expect(field.value).to.equal(['multiply']);
  });

  test('has a hidden csrf field', async () => {
    const form = meterDetailsForm(createRequest(), createReturn(true));
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a continue button', async () => {
    const form = meterDetailsForm(createRequest(), createReturn(true));
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });
});

const { expect } = require('code');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const { meterDetailsProvidedForm } = require('internal/modules/returns/forms/meter-details-provided');

experiment('meter-details-provided', () => {
  let request;
  let data;

  beforeEach(async () => {
    data = {};
    request = {
      view: {
        csrfToken: 'test-csrf-token'
      },
      query: {
        returnId: 'test-return-id'
      }
    };
  });

  test('has a hidden csrf field', async () => {
    const form = meterDetailsProvidedForm(request, data);
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has meter details question field', async () => {
    const form = meterDetailsProvidedForm(request, data);
    const meterDetails = form.fields.find(x => x.name === 'meterDetailsProvided');
    expect(meterDetails.options.label).to.equal('Have meter details been provided?');
    expect(meterDetails.options.widget).to.equal('radio');
  });

  test('has a continue button', async () => {
    const form = meterDetailsProvidedForm(request, data);
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  test('sets the data if provided', async () => {
    data.meters = [
      { meterDetailsProvided: true }
    ];
    const form = meterDetailsProvidedForm(request, data);
    const meterDetails = form.fields.find(x => x.name === 'meterDetailsProvided');

    expect(meterDetails.value).to.be.true();
  });
});

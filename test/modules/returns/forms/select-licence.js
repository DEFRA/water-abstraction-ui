const { find } = require('lodash');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { selectLicenceForm } = require('../../../../src/modules/returns/forms/index');

experiment('Returns: selectLicenceForm', () => {
  const returns = [{
    return_id: 'v1:123',
    licence_ref: '01/123',
    return_requirement: '10001234'
  }, {
    return_id: 'v1:456',
    licence_ref: '02/456',
    return_requirement: '10001234'
  }];

  const form = selectLicenceForm(returns);

  test('it should have the correct action URL', async () => {
    expect(form.action).to.equal('/admin/returns/select-licence');
  });

  test('it should be a GET request', async () => {
    expect(form.method.toLowerCase()).to.equal('get');
  });

  test('it should contain a formatId field', async () => {
    const formatId = find(form.fields, { name: 'formatId' });
    expect(formatId.value).to.equal('10001234');
  });

  test('it should contain choices for each return', async () => {
    const choices = find(form.fields, { name: 'returnId' }).options.choices;

    expect(choices).to.equal([
      { value: 'v1:123', label: '01/123' },
      { value: 'v1:456', label: '02/456' }
    ]);
  });
});

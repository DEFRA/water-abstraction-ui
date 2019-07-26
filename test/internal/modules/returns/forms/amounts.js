const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { find } = require('lodash');
const { form: amountsForm } = require('internal/modules/returns/forms/amounts');

const createRequest = (isInternal = true) => {
  return {
    view: {
      csrfToken: 'test-csrf-token'
    },
    query: {
      returnId: 'test-return-id'
    },
    auth: {
      credentials: {
        scope: isInternal ? 'internal' : 'external'
      }
    }
  };
};

experiment('amountsForm', () => {
  test('has a radio field for whether water has been abstracted field', async () => {
    const request = createRequest();
    const form = amountsForm(request, {});
    const isNil = find(form.fields, { name: 'isNil' });
    expect(isNil.options.widget).to.equal('radio');
  });

  test('internal label is shown for internal user', async () => {
    const request = createRequest();
    const form = amountsForm(request, {});
    const isNil = find(form.fields, { name: 'isNil' });
    expect(isNil.options.label).to.equal('Has water been abstracted in this return period?');
  });

  test('has a continue button', async () => {
    const request = createRequest();
    const form = amountsForm(request, {});
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  test('has a hidden csrf field', async () => {
    const request = createRequest();
    const form = amountsForm(request, {});
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });
});

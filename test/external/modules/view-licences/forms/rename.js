const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { renameLicenceForm, renameLicenceSchema } = require('external/modules/view-licences/forms/rename');
const Joi = require('@hapi/joi');

const createRequest = () => {
  return {
    params: {
      documentId: 'document_1'
    },
    view: {
      csrfToken: 'test-csrf-token'
    }
  };
};

experiment('view licences rename form', () => {
  let request, form;

  beforeEach(async () => {
    request = createRequest();
    form = renameLicenceForm(request);
  });

  test('form has correct action', async () => {
    expect(form.action).to.equal(`/licences/${request.params.documentId}/rename`);
  });

  test('has a hidden csrf field', async () => {
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a text input field', async () => {
    const input = form.fields.find(x => x.name === 'name');
    expect(input.options.widget).to.equal('text');
    expect(input.options.label).to.equal('Name this licence');
    expect(input.options.hint).to.equal('You can give this licence a name to help you search for it more easily.');
  });

  test('has a save button', async () => {
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Save';
    });
    expect(button).to.exist();
  });
});

experiment('view licences rename schema', () => {
  test('passes if a name is entered', async () => {
    const data = {
      name: 'A test name',
      csrf_token: 'dd858113-5e86-4ea3-bd00-eb1914eaf517'
    };
    expect(() => Joi.assert(data, renameLicenceSchema)).to.not.throw();
  });

  test('fails if CSRF token invalid', async () => {
    const data = {
      name: 'A test name',
      csrf_token: 'not-a-guid'
    };
    expect(() => Joi.assert(data, renameLicenceSchema)).to.throw();
  });

  test('fails if name < 2 chars', async () => {
    const data = {
      name: 'A',
      csrf_token: 'dd858113-5e86-4ea3-bd00-eb1914eaf517'
    };
    expect(() => Joi.assert(data, renameLicenceSchema)).to.throw();
  });

  test('fails if name >= 32 chars', async () => {
    const data = {
      name: '012345678901234567890123456789012',
      csrf_token: 'dd858113-5e86-4ea3-bd00-eb1914eaf517'
    };
    expect(() => Joi.assert(data, renameLicenceSchema)).to.throw();
  });
});

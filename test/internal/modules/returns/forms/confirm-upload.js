const { find, get } = require('lodash');
const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const confirmForm = require('internal/modules/returns/forms/confirm-upload');

const findButton = field => get(field, 'options.widget') === 'button';
const findCsrf = field => field.name === 'csrf_token';

experiment('confirmUploadForm', () => {
  const csrfToken = 'xyz';
  const eventId = 'event_1';

  const createRequest = () => {
    return {
      params: {
        eventId
      },
      view: {
        csrfToken
      }
    };
  };

  test('it should have the correct action path', async () => {
    const form = confirmForm(createRequest());
    expect(form.action).to.equal(`/returns/upload-submit/${eventId}`);
  });

  test('it should have singular button text for 1 return', async () => {
    const form = confirmForm(createRequest(), 1);
    const button = find(form.fields, findButton);
    expect(button.options.label).to.equal(`Submit 1 return`);
  });

  test('it should have plural button text for multiple returns', async () => {
    const form = confirmForm(createRequest(), 5);
    const button = find(form.fields, findButton);
    expect(button.options.label).to.equal(`Submit 5 returns`);
  });

  test('it should include the CSRF token', async () => {
    const form = confirmForm(createRequest());
    const csrf = find(form.fields, findCsrf);
    expect(csrf.value).to.equal(csrfToken);
    expect(csrf.options.type).to.equal('hidden');
  });
});

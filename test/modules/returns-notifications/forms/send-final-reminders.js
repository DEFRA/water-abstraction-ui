const { find } = require('lodash');
const { expect } = require('code');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const { sendRemindersForm } = require('../../../../src/modules/returns-notifications/forms/send-reminders');

const request = {
  view: {
    csrfToken: 'abc'
  }
};

experiment('sendRemindersForm', () => {
  let form;

  beforeEach(async () => {
    form = sendRemindersForm(request);
  });

  test('has the CSRF token set from the request', async () => {
    const csrfField = find(form.fields, field => field.name === 'csrf_token');
    expect(csrfField.value).to.equal(request.view.csrfToken);
  });

  test('posts to the correct URL', async () => {
    expect(form.action).to.equal('/admin/returns-notifications/reminders');
    expect(form.method).to.equal('POST');
  });

  test('contains the exclude licences field', async () => {
    const excludeLicencesField = find(form.fields, f => f.name === 'excludeLicences');
    expect(excludeLicencesField.options.label).to.equal('Exclude licences');
    expect(excludeLicencesField.options.multiline).to.be.true();
  });

  test('has the correct button text', async () => {
    const button = find(form.fields, field => field.options.widget === 'button');
    expect(button.options.label).to.equal('Send reminders');
  });
});

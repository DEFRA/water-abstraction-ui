require('dotenv').config();
const Lab = require('lab');
const { expect } = require('code');
const { find } = require('lodash');
const Joi = require('joi');

const { setStatusForm, setStatusSchema } = require('../../../../src/modules/abstraction-reform/forms/set-status');

const { scope } = require('../../../../src/lib/constants');

const {
  STATUS_IN_PROGRESS,
  STATUS_IN_REVIEW,
  STATUS_APPROVED,
  STATUS_LICENCE_REVIEW
} = require('../../../../src/modules/abstraction-reform/lib/statuses');

const lab = exports.lab = Lab.script();

const getRequest = (isApprover) => {
  const scopes = isApprover
    ? [scope.internal, scope.abstractionReformApprover]
    : [scope.internal, scope.abstractionReformUser];
  return {
    params: {
      documentId: '7af974c4-ce20-4d85-bf41-bd42c9fd5c0e'
    },
    view: {
      csrfToken: 'ccc36230-b93f-4d47-b028-b563f1fdc949'
    },
    auth: {
      credentials: {
        scope: scopes
      }
    }
  };
};

const findStatus = form => find(form.fields, { name: 'status' });
const findCsrf = form => find(form.fields, { name: 'csrf_token' });
const findButton = form => find(form.fields, { name: null });

lab.experiment('Test setStatusForm for AR user', () => {
  let form;
  let request;

  lab.before(async () => {
    request = getRequest();
    form = setStatusForm(request);
  });

  lab.test('The form action should have the correct action', async () => {
    expect(form.action).to.equal(`/admin/digitise/licence/${request.params.documentId}/status`);
  });

  lab.test('The form should include the CSRF token', async () => {
    const csrf = findCsrf(form);
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  lab.test('The only available status should be review', async () => {
    const status = findStatus(form);
    expect(status.options.type).to.be.equal('hidden');
    expect(status.value).to.equal(STATUS_IN_REVIEW);
  });

  lab.test('The button text should be Submit for approval', async () => {
    const status = findButton(form);
    expect(status.options.label).to.be.equal('Submit for approval');
  });
});

lab.experiment('Test setStatusForm for AR approver', () => {
  let form;
  let request;

  lab.before(async () => {
    request = getRequest(true);
    form = setStatusForm(request);
  });

  lab.test('The form action should have the correct action', async () => {
    expect(form.action).to.equal(`/admin/digitise/licence/${request.params.documentId}/status`);
  });

  lab.test('The form should include the CSRF token', async () => {
    const csrf = findCsrf(form);
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  lab.test('The form should have the correct status options', async () => {
    const status = findStatus(form);
    const statusValues = status.options.choices.map(choice => choice.value);
    expect(statusValues).to.equal([STATUS_IN_PROGRESS, STATUS_APPROVED, STATUS_LICENCE_REVIEW]);
  });

  lab.test('The button text should be Save decision', async () => {
    const status = findButton(form);
    expect(status.options.label).to.be.equal('Save decision');
  });
});

lab.experiment('Test setStatusSchema for AR user', () => {
  let schema;
  let request;

  lab.before(async () => {
    request = getRequest();
    schema = Joi.describe(setStatusSchema(request));
  });

  lab.test('It should only allow status to be In review', async () => {
    expect(schema.children.status.valids).to.equal([STATUS_IN_REVIEW]);
  });
});

lab.experiment('Test setStatusSchema for AR approver', () => {
  let schema;
  let request;

  lab.before(async () => {
    request = getRequest(true);
    schema = Joi.describe(setStatusSchema(request));
  });

  lab.test('It should only allow the correct statuses', async () => {
    expect(schema.children.status.valids).to.equal([STATUS_IN_PROGRESS, STATUS_APPROVED, STATUS_LICENCE_REVIEW]);
  });
});

exports.lab = lab;

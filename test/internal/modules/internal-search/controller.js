'use strict';

const { cloneDeep, set } = require('lodash');
const sandbox = require('sinon').createSandbox();
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const controller = require('internal/modules/internal-search/controller');
const services = require('internal/lib/connectors/services');
const { scope } = require('internal/lib/constants');
const { permissionsChoices } = require('internal/modules/account/forms/set-permissions');
const forms = require('shared/lib/forms');

const getUserStatusResponses = require('../../../shared/responses/water-service/user/_userId_/status');

experiment('getSearchForm', () => {
  const h = {};
  const baseRequest = {
    auth: {
      credentials: {
        scope: [scope.internal, scope.returns]
      }
    },
    query: {},
    view: {},
    log: console.log
  };

  beforeEach(async () => {
    h.view = sandbox.stub();
    h.redirect = sandbox.stub();
    sandbox.stub(services.water.internalSearch, 'getInternalSearchResults').resolves({
      users: [{ user_id: 123 }]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should display the form if no search query is present', async () => {
    const request = cloneDeep(baseRequest);
    await controller.getSearchForm(request, h);

    const [template, view] = h.view.firstCall.args;
    expect(template).to.equal('nunjucks/internal-search/index.njk');
    expect(view.form).to.be.an.object();
    expect(view.form.errors).to.be.empty();
    expect(view.returns).to.be.undefined();
    expect(view.documents).to.be.undefined();
    expect(view.users).to.be.undefined();
    expect(view.noResults).to.be.undefined();
  });

  test('It should display an error if search query was supplied but empty', async () => {
    const request = set(cloneDeep(baseRequest), 'query.query', '');
    await controller.getSearchForm(request, h);
    const view = h.view.firstCall.args[1];
    expect(view.form.errors[0].name).to.equal('query');
  });

  test('It should display results if a valid search term is supplied', async () => {
    const request = set(cloneDeep(baseRequest), 'query.query', '01/123/456');
    await controller.getSearchForm(request, h);
    const view = h.view.firstCall.args[1];
    expect(view.users[0].user_id).to.equal(123);
  });

  test('It should redirect if user searches for exact return ID', async () => {
    const returnId = 'v1:1:01/123:123456:2017-10-31:2018-10-31';
    sandbox.restore();
    sandbox.stub(services.water.internalSearch, 'getInternalSearchResults').resolves({
      returns: [{
        return_id: returnId
      }]
    });

    const request = set(cloneDeep(baseRequest), 'query.query', returnId);
    await controller.getSearchForm(request, h);

    const [ path ] = h.redirect.firstCall.args;
    expect(path).to.equal(`/return/internal?returnId=${returnId}`);
  });
});

experiment('getUserStatus', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.idm.users, 'findOneById');
    sandbox
      .stub(services.water.users, 'getUserStatus')
      .resolves(getUserStatusResponses.externalUserWithLicences());

    request = { params: { userId: 1234 }, view: {} };
    h = {
      view: sandbox.spy()
    };
    await controller.getUserStatus(request, h);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the user id from the request to the water service', async () => {
    const [userId] = services.water.users.getUserStatus.firstCall.args;
    expect(userId).to.equal(request.params.userId);
  });

  test('adds the number of licences with outstanding verifications', async () => {
    const [, view] = h.view.firstCall.args;
    expect(view.userStatus.unverifiedLicenceCount).to.equal(2);
  });

  test('adds the number of verified licences', async () => {
    const [, view] = h.view.firstCall.args;
    expect(view.userStatus.verifiedLicenceCount).to.equal(3);
  });

  test('adds a licence count to the view', async () => {
    const [, view] = h.view.firstCall.args;
    // three registered, plus two outstanding verifications
    expect(view.userStatus.licenceCount).to.equal(5);
  });

  test('licences is zero when there are none', async () => {
    services.water.users.getUserStatus.resolves(
      getUserStatusResponses.externalUserWithoutLicences()
    );

    await controller.getUserStatus(request, h);

    const [, view] = h.view.lastCall.args;
    expect(view.userStatus.licenceCount).to.equal(0);
  });

  test('adds the form', async () => {
    await controller.getUserStatus(request, h, { test: 'form' });

    const [, view] = h.view.lastCall.args;
    expect(view.form).to.be.an.object();
  });

  test('adds the form from post if exists', async () => {
    await controller.getUserStatus(request, h, { test: 'form' });

    const [, view] = h.view.lastCall.args;
    expect(view.form).to.equal({ test: 'form' });
  });

  test('adds the link to delete the account', async () => {
    await controller.getUserStatus(request, h);

    const [, view] = h.view.lastCall.args;
    expect(view.deleteAccountLink).to.equal(`/account/delete-account/${request.params.userId}`);
  });
});

experiment('postUpdatePermissions', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.water.users, 'updateInternalUserPermissions').resolves({});
    sandbox.stub(services.water.users, 'getUserStatus').resolves(
      getUserStatusResponses.internalUser()
    );
    sandbox.stub(forms, 'handleRequest').returns({ isValid: true });

    request = {
      auth: {
        credentials: {
          scope: ['manage_accounts']
        }
      },
      defra: {
        userId: 1111
      },
      params: {
        userId: 1234
      },
      payload: {
        permission: 'basic'
      },
      view: {
        csrfToken: '12345678-0000-test-0000-000000000000'
      } };

    h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the callingUserId, userId and permission from the request to the water service', async () => {
    await controller.postUpdatePermissions(request, h);
    const [callingUserId, userId, permission] = services.water.users.updateInternalUserPermissions.lastCall.args;
    expect(callingUserId).to.equal(request.defra.userId);
    expect(userId).to.equal(request.params.userId);
    expect(permission).to.equal(request.payload.permission);
  });
});

experiment('getUpdateSuccessful', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.idm.users, 'findOneById').resolves({ user_name: 'test@defra.gov.uk', roles: [], groups: [] });
    sandbox.stub(services.water.users, 'getUserStatus').resolves(
      getUserStatusResponses.internalUser()
    );

    request = {
      auth: {
        credentials: {
          scope: ['manage_accounts']
        }
      },
      defra: {
        userId: 1111
      },
      params: {
        userId: 1234
      },
      payload: {
        permission: 'billing_and_data'
      } };

    h = {
      view: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the correct template', async () => {
    await controller.getUpdateSuccessful(request, h);
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/internal-search/update-permissions-success.njk');
  });

  test('view contains correct back link', async () => {
    await controller.getUpdateSuccessful(request, h);
    const [, view] = h.view.lastCall.args;
    expect(view.back).to.equal(`/user/${request.params.userId}/status`);
  });

  test('view contains email and permissions of updated user', async () => {
    services.idm.users.findOneById.resolves({ user_name: 'test@defra.gov.uk', roles: [], groups: ['billing_and_data'] });
    await controller.getUpdateSuccessful(request, h);
    const [permissionLabelText] = permissionsChoices.filter(choice => choice.value === request.payload.permission);
    const [, view] = h.view.lastCall.args;
    expect(view.updatedUser).to.equal('test@defra.gov.uk');
    expect(view.updatedPermissions).to.equal(permissionLabelText);
  });
});

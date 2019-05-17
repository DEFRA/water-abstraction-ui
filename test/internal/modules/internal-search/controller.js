'use strict';

const { cloneDeep, set } = require('lodash');
const sinon = require('sinon');
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const controller = require('../../../../src/internal/modules/internal-search/controller');
const water = require('../../../../src/internal/lib/connectors/water');
const waterServiceUserConnector = require('../../../../src/internal/lib/connectors/water-service/user');
const { scope } = require('../../../../src/internal/lib/constants');

const getUserStatusResponses = require('../../responses/water-service/user/_userId_/status');

experiment('getSearchForm', () => {
  const h = {};
  let apiStub;
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
    h.view = sinon.stub();
    h.redirect = sinon.stub();
    apiStub = sinon.stub(water, 'getInternalSearchResults').resolves({
      users: [{ user_id: 123 }]
    });
  });

  afterEach(async () => {
    apiStub.restore();
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
    apiStub.restore();
    apiStub = sinon.stub(water, 'getInternalSearchResults').resolves({
      returns: [{
        return_id: returnId
      }]
    });

    const request = set(cloneDeep(baseRequest), 'query.query', returnId);
    await controller.getSearchForm(request, h);

    const [ path ] = h.redirect.firstCall.args;
    expect(path).to.equal(`/admin/return/internal?returnId=${returnId}`);
  });
});

experiment('getUserStatus', () => {
  let request;
  let h;

  beforeEach(async () => {
    sinon
      .stub(waterServiceUserConnector, 'getUserStatus')
      .resolves(getUserStatusResponses.externalUserWithLicences());

    request = { params: { userId: 1234 }, view: {} };
    h = {
      view: sinon.spy()
    };
    await controller.getUserStatus(request, h);
  });

  afterEach(async () => {
    waterServiceUserConnector.getUserStatus.restore();
  });

  test('passes the user id from the request to the water service', async () => {
    const [userId] = waterServiceUserConnector.getUserStatus.firstCall.args;
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
    waterServiceUserConnector.getUserStatus.resolves(
      getUserStatusResponses.externalUserWithoutLicences()
    );

    await controller.getUserStatus(request, h);

    const [, view] = h.view.lastCall.args;
    expect(view.userStatus.licenceCount).to.equal(0);
  });
});

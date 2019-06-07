const { expect, fail } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const communicationsConnector = require('../../../../src/external/lib/connectors/water-service/communications');

const communicationResponses = require('../../responses/water-service/communications/_documentId_');

const controller = require('../../../../src/external/modules/view-licences/controller');
const { scope } = require('../../../../src/external/lib/constants');
const returnsConnector = require('../../../../src/external/lib/connectors/returns');
const licenceConnector = require('../../../../src/external/lib/connectors/water-service/licences');

experiment('getLicences', () => {
  test('redirects to security code page if no licences but outstanding verifications', async () => {
    const request = {
      licence: {
        userLicenceCount: 0,
        outstandingVerifications: [{ id: 1 }]
      }
    };

    const h = {
      redirect: sinon.stub().resolves('ok')
    };

    await controller.getLicences(request, h);
    expect(h.redirect.calledWith('/security-code')).to.be.true();
  });

  test('redirects to add licences page if no licences or outstanding verifications', async () => {
    const request = {
      licence: {
        userLicenceCount: 0,
        outstandingVerifications: []
      }
    };

    const h = {
      redirect: sinon.stub().resolves('ok')
    };

    await controller.getLicences(request, h);
    expect(h.redirect.calledWith('/add-licences')).to.be.true();
  });
});

experiment('getLicenceCommunication', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(communicationsConnector, 'getCommunication').resolves(communicationResponses.getCommunication());

    h = {
      view: (...args) => args
    };

    request = {
      view: {},
      params: {
        documentId: 'doc-id-1',
        communicationId: 'notification-id'
      },
      auth: {
        credentials: {
          scope: scope.licenceHolder
        }
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('assigns the licence details to the view model', async () => {
    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.licence.documentId).to.equal('doc-id-1');
    expect(view.licence.companyEntityId).to.equal('company-id-1');
    expect(view.licence.documentName).to.equal('doc-1-name');
    expect(view.licence.licenceRef).to.equal('lic-1');
  });

  test('when the document has a name, it is added to the page title', async () => {
    const response = communicationResponses.getCommunication();
    response.data.licenceDocuments[0].documentName = 'named document';
    communicationsConnector.getCommunication.resolves(response);

    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.pageTitle).to.equal('named document, message review');
  });

  test('when the document has no name, the licence ref is added to the page title', async () => {
    const response = communicationResponses.getCommunication();
    response.data.licenceDocuments[0].documentName = null;
    communicationsConnector.getCommunication.resolves(response);

    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.pageTitle).to.equal('lic-1, message review');
  });

  test('the message content is added to the view', async () => {
    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.messageContent).to.equal('Test message content');
  });

  test('the message type is added to the view', async () => {
    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.messageType).to.equal('Message Type');
  });

  test('the message sent date is added to the view', async () => {
    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.sentDate).to.equal('2018-01-01T00:00:00.000Z');
  });

  test('the recipientAddressParts is added to the view', async () => {
    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.recipientAddressParts).to.equal(['Add 1', 'Add 2', 'Add 3', 'Add 4', 'Add 5', 'AB1 2CD']);
  });

  test('recipientAddressParts excludes falsey data', async () => {
    const response = communicationResponses.getCommunication();
    response.data.notification.address.addressLine2 = '    ';
    response.data.notification.address.addressLine4 = '';
    communicationsConnector.getCommunication.resolves(response);

    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.recipientAddressParts).to.equal(['Add 1', 'Add 3', 'Add 5', 'AB1 2CD']);
  });

  test('recipientAddressParts trims address data', async () => {
    const response = communicationResponses.getCommunication();
    response.data.notification.address.addressLine1 = ' Add 1 ';
    response.data.notification.address.addressLine2 = ' Add 2';
    response.data.notification.address.addressLine3 = 'Add 3 ';
    communicationsConnector.getCommunication.resolves(response);

    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.recipientAddressParts).to.equal(['Add 1', 'Add 2', 'Add 3', 'Add 4', 'Add 5', 'AB1 2CD']);
  });

  test('returns a 404 if the document id is not related to the notification', async () => {
    request.params.documentId = 'nope';

    try {
      await controller.getLicenceCommunication(request, h);
      fail('exception should have been thrown');
    } catch (error) {
      expect(error.isBoom).to.be.true();
      expect(error.output.statusCode).to.equal(404);
    }
  });

  test('requests the layout renders the back link', async () => {
    const [, view] = await controller.getLicenceCommunication(request, h);
    expect(view.back).to.equal('/licences/doc-id-1#communications');
  });
});

experiment('getExpiredLicence', () => {
  let request;
  let h;

  beforeEach(async () => {
    h = {
      view: sandbox.spy()
    };

    sandbox.stub(licenceConnector, 'getLicenceByDocumentId').resolves({
      data: {
        document: {
          name: 'test-doc-name'
        },
        licence_ref: 'test-licence-ref',
        earliestEndDate: '20190101',
        earliestEndDateReason: 'expired'
      }
    });

    sandbox.stub(returnsConnector.returns, 'findMany').resolves({
      data: [{ return_id: 'test-return' }],
      pagination: { pageCount: 1 }
    });

    sandbox.stub(licenceConnector, 'getLicenceCommunicationsByDocumentId').resolves({
      data: [{ id: 'test-message' }]
    });

    sandbox.stub(licenceConnector, 'getLicencePrimaryUserByDocumentId').resolves({
      userId: 1234,
      entityId: 'test-entity-id',
      userName: 'test-user@example.com',
      roles: [ 'primary_user' ]
    });

    request = {
      params: { documentId: 'test-doc-id' },
      view: {
        primaryUser: false,
        verifications: []
      },
      auth: {
        credentials: {
          scope: ['internal']
        }
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the correct template', async () => {
    await controller.getExpiredLicence(request, h);
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/view-licences/expired-licence.njk');
  });

  experiment('the view context contains', () => {
    test('the document id', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.documentId).to.equal('test-doc-id');
    });

    test('the expected licence details', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.licence.primaryUser.userName).to.equal('test-user@example.com');
      expect(view.licence.licenceNumber).to.equal('test-licence-ref');
      expect(view.licence.documentName).to.equal('test-doc-name');
      expect(view.licence.expiryDate).to.equal('1 January 2019');
    });

    test('the returns', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.returns[0].return_id).to.equal('test-return');
      expect(view.hasMoreReturns).to.be.false();
    });

    test('the messages', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.messages[0].id).to.equal('test-message');
    });

    test('the page title including the document name when present', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('Licence name test-doc-name');
    });

    test('the page title including the licence number when no document name', async () => {
      licenceConnector.getLicenceByDocumentId.resolves({
        data: {
          document: {
          },
          licence_ref: 'test-licence-ref',
          earliestEndDate: '20190101',
          earliestEndDateReason: 'expired'
        }
      });

      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('Licence number test-licence-ref');
    });

    test('the link back to the search including the licence number', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/licences?query=test-licence-ref');
    });

    test('the isInternal value set to true', async () => {
      await controller.getExpiredLicence(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.isInternal).to.be.true();
    });
  });
});

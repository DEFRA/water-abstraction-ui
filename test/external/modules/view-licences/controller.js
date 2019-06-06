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

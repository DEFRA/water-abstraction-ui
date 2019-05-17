'use strict';

const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const sinon = require('sinon');

const idm = require('../../../../src/external/lib/connectors/idm');
const controller = require('../../../../src/external/modules/contact-details/controller');

const stubFindOne = idm => {
  sinon.stub(idm.usersClient, 'findOne').resolves({
    data: {
      user_id: 'test-id',
      user_data: {
        contactDetails: {
          name: 'test-name',
          jobTitle: 'test-job-title',
          email: 'test-email',
          tel: 'test-tel',
          address: 'test-address'
        }
      }
    }
  });
};

lab.experiment('getContactInformation', () => {
  let responseToolkit;

  lab.beforeEach(async () => {
    stubFindOne(idm);
    responseToolkit = { view: sinon.spy() };
  });

  lab.afterEach(async () => {
    idm.usersClient.findOne.restore();
  });

  lab.test('adds the user to the payload', async () => {
    const request = {
      auth: {
        credentials: {
          user_id: 'test'
        }
      },
      view: {}
    };

    await controller.getContactInformation(request, responseToolkit);
    const viewContext = responseToolkit.view.lastCall.args[1];
    expect(viewContext.contactDetails).to.equal({
      name: 'test-name',
      jobTitle: 'test-job-title',
      email: 'test-email',
      tel: 'test-tel',
      address: 'test-address'
    });
  });
});

lab.experiment('postContactInformation', () => {
  let responseToolkit;

  lab.beforeEach(async () => {
    sinon.stub(idm.usersClient, 'updateOne').resolves({});
    stubFindOne(idm);
    responseToolkit = {
      view: sinon.spy(),
      redirect: sinon.spy()
    };
  });

  lab.afterEach(async () => {
    idm.usersClient.updateOne.restore();
    idm.usersClient.findOne.restore();
  });

  lab.test('adds the error to the payload when there is an error', async () => {
    const request = {
      auth: {
        credentials: {
          user_id: 'test'
        }
      },
      payload: {},
      formError: true,
      view: {
        errors: {
          'contact-email_email': 'error-value'
        }
      }
    };

    await controller.postContactInformation(request, responseToolkit);

    const viewContext = responseToolkit.view.lastCall.args[1];
    expect(viewContext.error).to.equal({
      contactEmail: 'error-value'
    });
  });

  lab.test('does not redirect if there is an error', async () => {
    const request = {
      auth: {
        credentials: { user_id: 'test' }
      },
      payload: {},
      view: {
        errors: {}
      },
      formError: { errorKey: 'error-value' }
    };

    await controller.postContactInformation(request, responseToolkit);
    expect(responseToolkit.redirect.callCount).to.equal(0);
  });

  lab.test('updates the user when there is no errors', async () => {
    const request = {
      auth: {
        credentials: { user_id: 'test-id' }
      },
      view: {
        payload: {
          'contact-name': 'update-name',
          'contact-job-title': 'update-job-title',
          'contact-tel': 'update-tel',
          'contact-email': 'update-email',
          'contact-address': 'update-address'
        }
      }
    };

    await controller.postContactInformation(request, responseToolkit);

    const updateOneArgs = idm.usersClient.updateOne.lastCall.args;
    expect(updateOneArgs[0]).to.equal('test-id');
    expect(updateOneArgs[1]).to.equal({
      user_data: {
        contactDetails: {
          name: 'update-name',
          jobTitle: 'update-job-title',
          tel: 'update-tel',
          email: 'update-email',
          address: 'update-address'
        }
      }
    });
  });
});

'use strict';

const { expect } = require('code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const idm = require('internal/lib/connectors/idm');
const controller = require('internal/modules/contact-details/controller');

experiment('getContactInformation', () => {
  let h;

  beforeEach(async () => {
    h = { view: sandbox.spy() };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('renders the form view', async () => {
    const request = {
      defra: {
        user: {
          user_data: {
            contactDetails: {
              name: 'test-name'
            }
          }
        }
      },
      view: {}
    };

    await controller.getContactInformation(request, h);
    const [templateName] = h.view.lastCall.args;
    expect(templateName).to.equal('nunjucks/form.njk');
  });
});

experiment('postContactInformation', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(idm.usersClient, 'updateOne').resolves({});

    h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('updates the user details', async () => {
    const request = {
      payload: {
        name: 'test-new-name',
        jobTitle: 'test-job-title',
        tel: 'test-tel',
        email: 'test-email@example.com',
        address: 'test-address',
        csrf_token: '00000000-0000-0000-0000-000000000000'
      },
      defra: {
        user: {
          user_id: 'test-user-id',
          user_data: {
            contactDetails: {
              name: 'test-name',
              jobTitle: 'test-job-title',
              tel: 'test-tel',
              email: 'test-email@example.com',
              address: 'test-address'
            }
          }
        }
      },
      view: {}
    };

    await controller.postContactInformation(request, h);

    const [userId, user] = idm.usersClient.updateOne.lastCall.args;

    expect(userId).to.equal('test-user-id');
    expect(user.user_data.contactDetails).to.equal({
      name: 'test-new-name',
      jobTitle: 'test-job-title',
      tel: 'test-tel',
      email: 'test-email@example.com',
      address: 'test-address'
    });
  });

  test('re-renders the form for invalid input', async () => {
    const request = {
      payload: {
        name: 'test-new-name',
        jobTitle: 'test-job-title',
        tel: 'test-tel',
        email: 'NOT A VALID EMAIL ADDRESS',
        address: 'test-address',
        csrf_token: '00000000-0000-0000-0000-000000000000'
      },
      defra: {
        user: {
          user_id: 'test-user-id',
          user_data: {
            contactDetails: {
              name: 'test-name',
              jobTitle: 'test-job-title',
              tel: 'test-tel',
              email: 'test-email@example.com',
              address: 'test-address'
            }
          }
        }
      },
      view: {}
    };

    await controller.postContactInformation(request, h);

    expect(idm.usersClient.updateOne.callCount).to.equal(0);
    const [templateName] = h.view.lastCall.args;
    expect(templateName).to.equal('nunjucks/form.njk');
  });
});

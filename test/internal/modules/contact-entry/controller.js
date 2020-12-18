'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controller = require('internal/modules/contact-entry/controller');
const session = require('internal/modules/contact-entry/lib/session');
const { CONTACT_TYPES } = require('internal/modules/contact-entry/lib/constants');

const KEY = 'test-key';
const CONTACT_ID = uuid();
const CSRF_TOKEN = uuid();
const COMPANY_NAME = 'TEST CO LTD';
const REDIRECT_PATH = '/redirect/path';
const BACK_PATH = '/back';

const CONTACT = {
  title: 'Mr',
  firstName: 'Lando',
  lastName: 'Norris',
  department: 'McLaren Racing'
};

experiment('src/internal/modules/contact-entry/controller', () => {
  let request, h;

  beforeEach(async () => {
    request = {
      method: 'get',
      params: {
        key: KEY
      },
      view: {
        csrfToken: CSRF_TOKEN
      },
      pre: {
        sessionData: {
          caption: 'Licence 01/234',
          back: BACK_PATH,
          redirectPath: REDIRECT_PATH
        },
        company: {
          name: COMPANY_NAME
        },
        companyContacts: [{
          id: CONTACT_ID,
          type: CONTACT_TYPES.department,
          department: 'Accounts Payable'
        }]
      },
      payload: {},
      query: {},
      yar: {
        get: sandbox.stub().returns(),
        set: sandbox.stub(),
        clear: sandbox.stub()
      }
    };

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };

    sandbox.stub(session, 'merge').returns({
      redirectPath: REDIRECT_PATH
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getSelectContact', () => {
    beforeEach(async () => {
      await controller.getSelectContact(request, h);
    });

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('the correct data is output to the view', async () => {
      const [, { pageTitle, caption, back, form }] = h.view.lastCall.args;
      expect(pageTitle).to.equal(`Setup a contact for ${COMPANY_NAME}`);
      expect(caption).to.equal(request.pre.sessionData.caption);
      expect(back).to.equal(BACK_PATH);
      expect(form).to.be.an.object();
    });
  });

  experiment('.postSelectContact', () => {
    beforeEach(async () => {
      request.method = 'post';
      request.path = `/contact-entry/${KEY}/select-contact`;
    });

    experiment('when the form is invalid', async () => {
      beforeEach(async () => {
        await controller.postSelectContact(request, h);
      });

      test('the user is redirected to the get page with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the form is valid', async () => {
      experiment('and an existing contact is selected', async () => {
        beforeEach(async () => {
          request.payload = {
            selectedContact: CONTACT_ID,
            csrf_token: CSRF_TOKEN
          };
          await controller.postSelectContact(request, h);
        });

        test('the contact id is stored in the session', async () => {
          expect(session.merge.calledWith(
            request, KEY, {
              data: { contactId: CONTACT_ID }
            }
          )).to.be.true();
        });

        test('redirects to the redirect path', async () => {
          expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
        });
      });

      experiment('and a new person is being created', async () => {
        beforeEach(async () => {
          request.payload = {
            selectedContact: CONTACT_TYPES.person,
            csrf_token: CSRF_TOKEN
          };
          await controller.postSelectContact(request, h);
        });

        test('no data is saved', async () => {
          expect(session.merge.called).to.be.false();
        });

        test('redirects to the create contact page', async () => {
          expect(h.redirect.calledWith(`/contact-entry/${KEY}/create-contact`)).to.be.true();
        });
      });

      experiment('and a new department is being created', async () => {
        beforeEach(async () => {
          request.payload = {
            selectedContact: CONTACT_TYPES.department,
            department: 'Accounts Payable',
            csrf_token: CSRF_TOKEN
          };
          await controller.postSelectContact(request, h);
        });

        test('the contact is stored in the session', async () => {
          expect(session.merge.calledWith(
            request, KEY, {
              data: {
                type: CONTACT_TYPES.department,
                department: 'Accounts Payable'
              }
            }
          )).to.be.true();
        });

        test('redirects to the redirect path', async () => {
          expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
        });
      });
    });
  });

  experiment('.getCreateContact', () => {
    beforeEach(async () => {
      await controller.getCreateContact(request, h);
    });

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('the correct data is output to the view', async () => {
      const [, { pageTitle, caption, back, form }] = h.view.lastCall.args;
      expect(pageTitle).to.equal(`Add a new contact for ${COMPANY_NAME}`);
      expect(caption).to.equal(request.pre.sessionData.caption);
      expect(back).to.equal(`/contact-entry/${KEY}/select-contact`);
      expect(form).to.be.an.object();
    });
  });

  experiment('.postCreateContact', () => {
    beforeEach(async () => {
      request.method = 'post';
    });

    experiment('when the form is invalid', async () => {
      beforeEach(async () => {
        await controller.postCreateContact(request, h);
      });

      test('the user is redirected to the get page with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the form is valid', async () => {
      beforeEach(async () => {
        request.payload = {
          ...CONTACT,
          csrf_token: CSRF_TOKEN
        };
        await controller.postCreateContact(request, h);
      });

      test('the contact is stored in the session', async () => {
        expect(session.merge.calledWith(
          request, KEY, {
            data: {
              type: CONTACT_TYPES.person,
              source: 'wrls',
              ...CONTACT
            }
          }
        )).to.be.true();
      });

      test('redirects to the redirect path', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
      });
    });
  });
});

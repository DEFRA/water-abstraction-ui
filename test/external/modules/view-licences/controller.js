const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { experiment, test, beforeEach, afterEach, it } = exports.lab = require('@hapi/lab').script();

const services = require('external/lib/connectors/services');
const controller = require('external/modules/view-licences/controller');

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

  experiment('view-licences/base', () => {
    const viewName = 'nunjucks/view-licences/licences';
    let h;

    beforeEach(async () => {
      sandbox.stub(services.idm.users, 'findOneByEmail');
      sandbox.stub(services.crm.documents, 'findMany');
      h = {
        view: sandbox.spy()
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    experiment('when the form is invalid', () => {
      let request;

      beforeEach(async () => {
        request = {
          view: {},
          formError: { email: true },
          licence: {
            licenceCount: 1,
            outstandingVerifications: []
          }
        };
        controller.getLicences(request, h);
      });

      it('the view is shown again', async () => {
        expect(h.view.calledWith(viewName, request.view)).to.be.true();
      });

      it('the controller does not get the user', async () => {
        expect(services.idm.users.findOneByEmail.notCalled).to.be.true();
      });

      it('the controller does not get the licences', async () => {
        expect(services.crm.documents.findMany.notCalled).to.be.true();
      });
    });

    experiment('when the user adds an unknown email address', () => {
      let request;

      beforeEach(async () => {
        request = {
          auth: {
            credentials: {
              userId: 'user_1'
            }
          },
          defra: {
            entityId: '123'
          },
          view: {},
          query: {
            emailAddress: 'test@example.com'
          },
          yar: {
            get: sandbox.stub().returns('company_1')
          },
          licence: {
            licenceCount: 1,
            outstandingVerifications: []
          }
        };

        services.idm.users.findOneByEmail.resolves();
        services.crm.documents.findMany.resolves({
          data: [],
          error: null,
          pagination: {}
        });

        await controller.getLicences(request, h);
      });

      it('an attempt is made to get the user by email', async () => {
        expect(services.idm.users.findOneByEmail.calledWith('test@example.com')).to.be.true();
      });

      it('an error is added to the view', async () => {
        expect(request.view.error).to.be.true();
      });
    });

    experiment('when the request is valid', async () => {
      let request;

      beforeEach(async () => {
        request = {
          auth: {
            credentials: {
              userId: 'user_1'
            }
          },
          defra: {
            entityId: '123'
          },
          view: {},
          query: { page: 1 },
          yar: {
            get: sandbox.stub().returns('company_1')
          },
          licence: {
            licenceCount: 1,
            outstandingVerifications: []
          }
        };

        services.crm.documents.findMany.resolves({
          data: [{ id: 1 }],
          error: null,
          pagination: { page: 1 }
        });

        controller.getLicences(request, h);
      });

      it('the view is shown using the expected view template', async () => {
        expect(h.view.firstCall.args[0]).to.equal(viewName);
      });

      it('the data is added to the response', async () => {
        const viewContext = h.view.firstCall.args[1];
        expect(viewContext.licenceData[0].id).to.equal(1);
        expect(viewContext.pagination.page).to.equal(1);
      });
    });
  });
});

experiment('rename a licence', async () => {
  const h = {
    view: sandbox.stub(),
    response: sandbox.stub(),
    redirect: sandbox.stub()
  };
  const form = {};
  const request = {
    defra: {
      userName: 'test-user'
    },
    params: {
      documentId: 'doc-id'
    },
    licence: {
      summary: {
        documentName: 'doc-name',
        licenceNumber: 'licence-ref'
      }
    },
    view: {
      csrfToken: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9'
    },
    payload: {
      csrf_token: '4abf7d0a-6148-4781-8c6a-7a8b9267b4a9',
      name: 'test-licence-name'
    }
  };

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getLicenceRename', async () => {
    beforeEach(async () => {
      await controller.getLicenceRename(request, h, form);
    });
    test('the expected view template is used for bill run type', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/view-licences/rename');
    });

    test('view context is assigned a back link path for type', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/licences/doc-id');
    });
    test('view context is assigned the correct page title', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('Name licence licence-ref');
    });
  });

  experiment('postLicenceRename', async () => {
    beforeEach(async () => {
      sandbox.stub(services.water.documents, 'postLicenceRename').resolves({ error: null });
      await controller.postLicenceRename(request, h);
    });

    test('documents water service is called with the correct arguments', async () => {
      const [, args] = services.water.documents.postLicenceRename.lastCall.args;
      expect(args).to.equal({ name: 'test-licence-name', rename: true, userName: 'test-user' });
    });

    test('redirects to the correct url', async () => {
      expect(h.redirect.lastCall.args).to.equal(['/licences/doc-id']);
    });
  });
});

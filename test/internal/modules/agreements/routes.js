'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const preHandlers = require('internal/modules/agreements/pre-handlers');
const sharedPreHandlers = require('shared/lib/pre-handlers/licences');

const routes = require('internal/modules/agreements/routes');
const controller = require('internal/modules/agreements/controller');

experiment('internal/modules/agreements/routes', () => {
  experiment('.getDeleteAgreement', () => {
    test('limits scope to users with delete_agreements role', async () => {
      expect(routes.getDeleteAgreement.options.auth.scope)
        .to.only.include([scope.deleteAgreements]);
    });

    test('uses the loadAgreement pre handler', async () => {
      expect(routes.getDeleteAgreement.options.pre[0].method)
        .to.equal(preHandlers.loadAgreement);
    });

    test('saves agreement to expected place', async () => {
      expect(routes.getDeleteAgreement.options.pre[0].assign)
        .to.equal('agreement');
    });

    test('uses the loadLicence pre handler', async () => {
      expect(routes.getDeleteAgreement.options.pre[1].method)
        .to.equal(sharedPreHandlers.loadLicence);
    });

    test('saves licence to expected place', async () => {
      expect(routes.getDeleteAgreement.options.pre[1].assign)
        .to.equal('licence');
    });

    test('uses the loadDocument pre handler', async () => {
      expect(routes.getDeleteAgreement.options.pre[2].method)
        .to.equal(sharedPreHandlers.loadLicenceDocument);
    });

    test('saves document to expected place', async () => {
      expect(routes.getDeleteAgreement.options.pre[2].assign)
        .to.equal('document');
    });
  });

  experiment('.postDeleteAgreement', () => {
    test('limits scope to users with delete agreements role', async () => {
      expect(routes.postDeleteAgreement.options.auth.scope)
        .to.only.include([scope.deleteAgreements]);
    });

    test('uses the loadDocument pre handler', async () => {
      expect(routes.postDeleteAgreement.options.pre[0].method)
        .to.equal(sharedPreHandlers.loadLicenceDocument);
    });

    test('saves document to expected place', async () => {
      expect(routes.postDeleteAgreement.options.pre[0].assign)
        .to.equal('document');
    });
  });

  experiment('.getSelectAgreementType', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.getSelectAgreementType.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.getSelectAgreementType.handler).to.equal(controller.getSelectAgreementType);
    });

    test('uses the getFlowState pre handler', async () => {
      const { pre } = routes.getSelectAgreementType.options;
      expect(pre).to.include({
        method: preHandlers.getFlowState, assign: 'flowState'
      });
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.getSelectAgreementType.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });

    test('uses the loadLicenceDocument pre handler', async () => {
      const { pre } = routes.getSelectAgreementType.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicenceDocument, assign: 'document'
      });
    });
  });

  experiment('.postSelectAgreementType', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.postSelectAgreementType.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.postSelectAgreementType.handler).to.equal(controller.postSelectAgreementType);
    });

    test('uses the getFlowState pre handler', async () => {
      const { pre } = routes.postSelectAgreementType.options;
      expect(pre).to.include({
        method: preHandlers.getFlowState, assign: 'flowState'
      });
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.postSelectAgreementType.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });

    test('uses the loadLicenceDocument pre handler', async () => {
      const { pre } = routes.postSelectAgreementType.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicenceDocument, assign: 'document'
      });
    });
  });

  experiment('.getDateSigned', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.getDateSigned.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.getDateSigned.handler).to.equal(controller.getDateSigned);
    });

    test('uses the getFlowState pre handler', async () => {
      const { pre } = routes.getDateSigned.options;
      expect(pre).to.include({
        method: preHandlers.getFlowState, assign: 'flowState'
      });
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.getDateSigned.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });
  });

  experiment('.postDateSigned', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.postDateSigned.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.postDateSigned.handler).to.equal(controller.postDateSigned);
    });

    test('uses the getFlowState pre handler', async () => {
      const { pre } = routes.postDateSigned.options;
      expect(pre).to.include({
        method: preHandlers.getFlowState, assign: 'flowState'
      });
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.postDateSigned.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });
  });

  experiment('.getCheckStartDate', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.getCheckStartDate.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.getCheckStartDate.handler).to.equal(controller.getCheckStartDate);
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.getCheckStartDate.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });
  });

  experiment('.postCheckStartDate', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.postCheckStartDate.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.postCheckStartDate.handler).to.equal(controller.postCheckStartDate);
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.postCheckStartDate.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });
  });

  experiment('.getCheckAnswers', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.getCheckAnswers.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.getCheckAnswers.handler).to.equal(controller.getCheckAnswers);
    });

    test('uses the getFlowState pre handler', async () => {
      const { pre } = routes.getCheckAnswers.options;
      expect(pre).to.include({
        method: preHandlers.getFlowState, assign: 'flowState'
      });
    });

    test('uses the loadLicence pre handler', async () => {
      const { pre } = routes.getCheckAnswers.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicence, assign: 'licence'
      });
    });
  });

  experiment('.postCheckAnswers', () => {
    test('limits scope to users with manage agreements role', async () => {
      expect(routes.postCheckAnswers.options.auth.scope)
        .to.only.include([scope.manageAgreements]);
    });

    test('uses the correct handler', async () => {
      expect(routes.postCheckAnswers.handler).to.equal(controller.postCheckAnswers);
    });

    test('uses the getFlowState pre handler', async () => {
      const { pre } = routes.postCheckAnswers.options;
      expect(pre).to.include({
        method: preHandlers.getFlowState, assign: 'flowState'
      });
    });

    test('uses the loadLicenceDocument pre handler', async () => {
      const { pre } = routes.postCheckAnswers.options;
      expect(pre).to.include({
        method: sharedPreHandlers.loadLicenceDocument, assign: 'document'
      });
    });
  });
});

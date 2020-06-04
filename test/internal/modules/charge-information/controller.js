'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/charge-information/controller');

const createRequest = () => ({
  params: {
    licenceId: 'test-licence-id'
  },
  view: {
    foo: 'bar'
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123'
    },
    draftChargeInformation: {
      chargeElements: []
    }
  }
});

experiment('internal/modules/charge-information/controller', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getTaskList', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getTasklist(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/task-list.njk');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.be.a.string();
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Set up charge information');
    });

    test('has a tasklist array', async () => {
      const { taskList } = h.view.lastCall.args[1];
      expect(taskList).to.be.an.array();
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    experiment('the first tasklist section', () => {
      test('has a heading for charge information', async () => {
        const { taskList } = h.view.lastCall.args[1];
        expect(taskList[0].heading).to.equal('Charge information');
      });

      test('the first task is to select a reason', async () => {
        const { taskList } = h.view.lastCall.args[1];
        const task = taskList[0].tasks[0];
        expect(task.text).to.equal('Select reason for new charge information');
        expect(task.badge.text).to.equal('Not started');
        expect(task.badge.status).to.equal('inactive');
        expect(task.link).to.equal('/licences/test-licence-id/charge-information/reason');
      });

      experiment('when the reason is set', () => {
        beforeEach(async () => {
          request = createRequest();
          request.pre.draftChargeInformation.changeReason = {
            changeReasonId: 'test-reason-id'
          };
          await controller.getTasklist(request, h);
        });

        test('the badge changes to completed', async () => {
          const { taskList } = h.view.lastCall.args[1];
          const task = taskList[0].tasks[0];
          expect(task.badge.text).to.equal('Completed');
          expect(task.badge.status).to.equal('success');
        });
      });

      test('the second task is to set a start date', async () => {
        const { taskList } = h.view.lastCall.args[1];
        const task = taskList[0].tasks[1];
        expect(task.text).to.equal('Set charge start date');
        expect(task.badge.text).to.equal('Not started');
        expect(task.badge.status).to.equal('inactive');
        expect(task.link).to.equal('/licences/test-licence-id/charge-information/start-date');
      });

      experiment('when the start date is set', () => {
        beforeEach(async () => {
          request = createRequest();
          request.pre.draftChargeInformation.startDate = '2019-01-01';
          await controller.getTasklist(request, h);
        });

        test('the badge changes to completed', async () => {
          const { taskList } = h.view.lastCall.args[1];
          const task = taskList[0].tasks[1];
          expect(task.badge.text).to.equal('Completed');
          expect(task.badge.status).to.equal('success');
        });
      });

      test('the third task is to set up a charge element', async () => {
        const { taskList } = h.view.lastCall.args[1];
        const task = taskList[0].tasks[2];
        expect(task.text).to.equal('Set up element');
        expect(task.badge.text).to.equal('Not started');
        expect(task.badge.status).to.equal('inactive');
        expect(task.link).to.be.undefined();
      });

      experiment('when there are 1+ elements', () => {
        beforeEach(async () => {
          request = createRequest();
          request.pre.draftChargeInformation.chargeElements = [{
            description: 'Test element'
          }];
          await controller.getTasklist(request, h);
        });

        test('the badge changes to completed', async () => {
          const { taskList } = h.view.lastCall.args[1];
          const task = taskList[0].tasks[2];
          expect(task.badge.text).to.equal('Completed');
          expect(task.badge.status).to.equal('success');
        });
      });
    });

    experiment('the second tasklist section', () => {
      test('has a heading for billing contact', async () => {
        const { taskList } = h.view.lastCall.args[1];
        expect(taskList[1].heading).to.equal('Billing contact');
      });

      test('the first task is to select a billing contact', async () => {
        const { taskList } = h.view.lastCall.args[1];
        const task = taskList[1].tasks[0];
        expect(task.text).to.equal('Set up billing contact');
        expect(task.badge.text).to.equal('Not started');
        expect(task.badge.status).to.equal('inactive');
        expect(task.link).to.be.undefined();
      });

      experiment('when a billing contact is set', () => {
        beforeEach(async () => {
          request = createRequest();
          request.pre.draftChargeInformation.invoiceAccount = {
            invoiceAccountId: 'test-invoice-account-id'
          };
          await controller.getTasklist(request, h);
        });

        test('the badge changes to completed', async () => {
          const { taskList } = h.view.lastCall.args[1];
          const task = taskList[1].tasks[0];
          expect(task.badge.text).to.equal('Completed');
          expect(task.badge.status).to.equal('success');
        });
      });
    });

    experiment('the third tasklist section', () => {
      test('has a heading for check and confirm', async () => {
        const { taskList } = h.view.lastCall.args[1];
        expect(taskList[2].heading).to.equal('Check and confirm');
      });

      test('the first task is to select a billing contact', async () => {
        const { taskList } = h.view.lastCall.args[1];
        const task = taskList[2].tasks[0];
        expect(task.text).to.equal('Check charge information');
        expect(task.badge).to.be.undefined();
        expect(task.link).to.be.undefined();
      });
    });
  });
});

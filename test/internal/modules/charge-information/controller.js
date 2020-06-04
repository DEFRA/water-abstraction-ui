'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const { find } = require('lodash');

const sandbox = sinon.createSandbox();

const controller = require('internal/modules/charge-information/controller');

const createRequest = () => ({
  params: {
    licenceId: 'test-licence-id'
  },
  view: {
    foo: 'bar',
    csrfToken: 'csrf-token'
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123'
    },
    changeReasons: [{
      changeReasonId: 'test-reason-1',
      description: 'New licence'
    }, {
      changeReasonId: 'test-reason-2',
      description: 'Transfer'
    }],
    draftChargeInformation: {
      chargeElements: []
    }
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub()
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

  experiment('.getReason', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getReason(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/form.njk');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/licences/test-licence-id/charge-information/task-list');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Select reason for new charge information');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has a form', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form).to.be.an.object();
    });

    test('the form action is correct', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form.action).to.equal('/licences/test-licence-id/charge-information/reason');
    });

    test('the form has a hidden CSRF field', async () => {
      const { form } = h.view.lastCall.args[1];
      const field = find(form.fields, { name: 'csrf_token' });
      expect(field.value).to.equal(request.view.csrfToken);
      expect(field.options.type).to.equal('hidden');
    });

    test('the form has a radio field for the change reasons', async () => {
      const { form } = h.view.lastCall.args[1];
      const field = find(form.fields, { name: 'reason' });
      expect(field.options.widget).to.equal('radio');
      expect(field.options.choices).to.be.an.array();
      expect(field.options.choices[0].label).to.equal('New licence');
      expect(field.options.choices[0].value).to.equal('test-reason-1');
      expect(field.options.choices[1].label).to.equal('Transfer');
      expect(field.options.choices[1].value).to.equal('test-reason-2');
      expect(field.value).to.be.undefined();
    });

    test('the form has a continue button', async () => {
      const { form } = h.view.lastCall.args[1];
      const field = find(form.fields, field => field.options.widget === 'button');
      expect(field.options.label).to.equal('Continue');
    });

    experiment('when a reason is set in the charge information', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.changeReason = {
          changeReasonId: 'test-reason-1'
        };
        await controller.getReason(request, h);
      });

      test('the radio field is selected', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'reason' });
        expect(field.value).to.equal('test-reason-1');
      });
    });
  });
});

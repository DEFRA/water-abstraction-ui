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
const moment = require('moment');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const controller = require('internal/modules/charge-information/controller');

const createRequest = () => ({
  params: {
    licenceId: 'test-licence-id'
  },
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123',
      startDate: moment().subtract(2, 'years').format('YYYY-MM-DD')
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
  },
  server: {
    methods: {
      setDraftChargeInformation: sandbox.stub()
    }
  }
});

const getReadableDate = str => moment(str).format('D MMMM YYYY');
const getISODate = str => moment(str).format('YYYY-MM-DD');

experiment('internal/modules/charge-information/controller', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
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

  experiment('.postReason', () => {
    experiment('when a valid reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          reason: 'test-reason-1'
        };
        await controller.postReason(request, h);
      });

      test('the draft charge information is updated with the reason', async () => {
        const [id, data] = request.server.methods.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.changeReason.changeReasonId).to.equal(request.payload.reason);
      });

      test('the user is redirected to the tasklist page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/task-list'
        )).to.be.true();
      });
    });

    experiment('when no reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken
        };
        await controller.postReason(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.server.methods.setDraftChargeInformation.called).to.be.false();
      });

      test('the form in error state is passed to the post-redirect-get handler', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].message).to.equal('Select a reason for new charge information');
      });
    });
  });

  experiment('.getStartDate', () => {
    experiment('when the licence start date is in the past 6 years', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.licence.startDate = moment().subtract(2, 'years').format('YYYY-MM-DD');
        await controller.getStartDate(request, h);
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
        expect(pageTitle).to.equal('Set charge start date');
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
        expect(form.action).to.equal('/licences/test-licence-id/charge-information/start-date');
      });

      test('the form has a hidden CSRF field', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'csrf_token' });
        expect(field.value).to.equal(request.view.csrfToken);
        expect(field.options.type).to.equal('hidden');
      });

      test('the form has a radio fields for today, licence start date and custom date', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.options.widget).to.equal('radio');
        expect(field.options.choices).to.be.an.array();

        // Today
        expect(field.options.choices[0].label).to.equal('Today');
        expect(field.options.choices[0].value).to.equal('today');
        expect(field.options.choices[0].hint).to.equal(getReadableDate());

        // Licence start date
        expect(field.options.choices[1].label).to.equal('Licence start date');
        expect(field.options.choices[1].value).to.equal('licenceStartDate');
        expect(field.options.choices[1].hint).to.equal(getReadableDate(request.pre.licence.startDate));

        // Or divider
        expect(field.options.choices[2].divider).to.equal('or');

        // Custom date
        expect(field.options.choices[3].label).to.equal('Another date');
        expect(field.options.choices[3].value).to.equal('customDate');

        expect(field.value).to.be.undefined();
      });

      test('has a conditional field for a custom date', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.options.widget).to.equal('date');
        expect(field.options.label).to.equal('Start date');
        expect(field.value).to.be.undefined();
      });

      test('the form has a continue button', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, field => field.options.widget === 'button');
        expect(field.options.label).to.equal('Continue');
      });
    });

    experiment('when the licence start date is > 6 years in the past', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.licence.startDate = '1990-01-01';
        await controller.getStartDate(request, h);
      });

      test('the form has a radio fields for today, and custom date', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.options.widget).to.equal('radio');
        expect(field.options.choices).to.be.an.array();

        // Today
        expect(field.options.choices[0].label).to.equal('Today');
        expect(field.options.choices[0].value).to.equal('today');
        expect(field.options.choices[0].hint).to.equal(getReadableDate());

        // Custom date
        expect(field.options.choices[1].label).to.equal('Another date');
        expect(field.options.choices[1].value).to.equal('customDate');

        expect(field.value).to.be.undefined();
      });
    });

    experiment("when the a start date has already been set to today's date", () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.startDate = getISODate();
        await controller.getStartDate(request, h);
      });

      test('the "today" radio option is selected"', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.value).to.equal('today');
      });
    });

    experiment('when the a start date has already been set to the licence start date', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.startDate = request.pre.licence.startDate;
        await controller.getStartDate(request, h);
      });

      test('the "today" radio option is selected"', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.value).to.equal('licenceStartDate');
      });
    });

    experiment('when the a start date has already been set to a custom date', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.startDate = moment().subtract(1, 'years').format('YYYY-MM-DD');
        await controller.getStartDate(request, h);
      });

      test('the "today" radio option is selected"', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.value).to.equal('customDate');
      });

      test('the conditional field for custom date has a value', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.value).to.equal(request.pre.draftChargeInformation.startDate);
      });
    });
  });

  experiment('.postStartDate', () => {
    experiment('when "today" is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'today'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated with the start date', async () => {
        const [id, data] = request.server.methods.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.startDate).to.equal(getISODate());
      });

      test('the user is redirected to the tasklist page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/task-list'
        )).to.be.true();
      });
    });

    experiment('when "licenceStartDate" is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'licenceStartDate'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated with the start date', async () => {
        const [id, data] = request.server.methods.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.startDate).to.equal(request.pre.licence.startDate);
      });

      test('the user is redirected to the tasklist page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/task-list'
        )).to.be.true();
      });
    });

    experiment('when "customDate" is posted', () => {
      const customDate = moment().subtract(1, 'year');

      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': customDate.format('DD'),
          'customDate-month': customDate.format('MM'),
          'customDate-year': customDate.format('YYYY')
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated with the start date', async () => {
        const [id, data] = request.server.methods.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.startDate).to.equal(customDate.format('YYYY-MM-DD'));
      });

      test('the user is redirected to the tasklist page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/task-list'
        )).to.be.true();
      });
    });

    experiment('when an invalid "customDate" is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': 'Last',
          'customDate-month': 'Tuesday',
          'customDate-year': 'Or Wednesday'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.server.methods.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.errors[0].message).to.equal('Enter a real date for the charge information start date');
      });
    });

    experiment('when a custom date before the licence started is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': '1',
          'customDate-month': '5',
          'customDate-year': '1966'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.server.methods.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.errors[0].message).to.equal('You must enter a date after the licence start date');
      });
    });

    experiment('when a custom date after the licence end date is posted', () => {
      beforeEach(async () => {
        const tomorrow = moment().add(1, 'day');

        request = createRequest();
        request.pre.licence.endDate = getISODate();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': tomorrow.format('DD'),
          'customDate-month': tomorrow.format('MM'),
          'customDate-year': tomorrow.format('YYYY')
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.server.methods.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.errors[0].message).to.equal('You must enter a date before the licence end date');
      });
    });

    experiment('when a custom date more than 6 years ago is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.licence.startDate = '1990-01-01';
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': '02',
          'customDate-month': '01',
          'customDate-year': '1990'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.server.methods.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[1].fields[0];
        expect(field.errors[0].message).to.equal("Date must be today or up to six years' in the past");
      });
    });
  });
});

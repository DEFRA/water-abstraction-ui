'use strict';

const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const session = require('internal/modules/gauging-stations/lib/session');
const removeTagsLicenceViewForm = require('internal/modules/gauging-stations/forms/remove-tags-licence-view');
const removeTagsLicenceSelectedForm = require('internal/modules/gauging-stations/forms/remove-tags-licence-selected');

experiment('internal/modules/gauging-stations/forms/remove-tags-licence-view.js', () => {
  let request, form, formBefore;
  const data = {
    data: [
      {
        licenceGaugingStationId: 'ee886147-ec1d-4a0f-8598-fc3f5886ee84',
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 1,
        abstractionPeriodEndDay: 11,
        abstractionPeriodEndMonth: 11,
        restrictionType: 'flow',
        alertType: 'stop_or_reduce',
        thresholdValue: '100',
        thresholdUnit: 'Ml/d',
        comstatus: null,
        dateStatusUpdated: null,
        licenceVersionPurposeConditionId: null,
        licenceId: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc',
        licenceRef: '11/42/18.6.2/262',
        startDate: '1965-11-26',
        label: 'STATION ROAD',
        gridReference: 'TQ7360023530',
        catchmentName: '',
        riverName: '',
        wiskiId: 'E6681',
        stationReference: 'E6681',
        easting: null,
        northing: null
      },
      {
        licenceGaugingStationId: 'd6369186-a485-48a1-878f-05b3b51a7c7f',
        abstractionPeriodStartDay: 13,
        abstractionPeriodStartMonth: 1,
        abstractionPeriodEndDay: 13,
        abstractionPeriodEndMonth: 2,
        restrictionType: 'flow',
        alertType: 'reduce',
        thresholdValue: '113',
        thresholdUnit: 'Ml/d',
        comstatus: null,
        dateStatusUpdated: null,
        licenceVersionPurposeConditionId: null,
        licenceId: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc',
        licenceRef: '11/42/18.6.2/262',
        startDate: '1965-11-26',
        label: 'STATION ROAD',
        gridReference: 'TQ7360023530',
        catchmentName: '',
        riverName: '',
        wiskiId: 'E6681',
        stationReference: 'E6681',
        easting: null,
        northing: null
      },
      {
        licenceGaugingStationId: '9177f85d-916c-4d51-8db7-74246d228b7b',
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 1,
        abstractionPeriodEndDay: 2,
        abstractionPeriodEndMonth: 2,
        restrictionType: 'flow',
        alertType: 'stop_or_reduce',
        thresholdValue: '115',
        thresholdUnit: 'Ml/d',
        comstatus: null,
        dateStatusUpdated: null,
        licenceVersionPurposeConditionId: null,
        licenceId: '6e21a77b-1525-459d-acb8-3615e5d53f06',
        licenceRef: '2672520010',
        startDate: '1966-12-30',
        label: 'STATION ROAD',
        gridReference: 'TQ7360023530',
        catchmentName: '',
        riverName: '',
        wiskiId: 'E6681',
        stationReference: 'E6681',
        easting: null,
        northing: null
      }
    ] };

  experiment('.form', () => {
    beforeEach(async () => {
      sandbox.stub(session, 'get').resolves({
        selectedCondition: [],
        licenceGaugingStations: data.data
      });

      request = {
        path: 'http://example.com/monitoring-stations/123/untagging-licence/remove-tag-multiple',
        view: {
          csrfToken: 'some-token'
        },
        pre: {
          licenceGaugingStations: data
        }
      };
    });
    afterEach(async () => sandbox.restore());

    experiment('request loaded ', () => {
      beforeEach(async () => {
        formBefore = removeTagsLicenceViewForm.form(request);
        form = removeTagsLicenceSelectedForm.form(request);
      });

      test('the form has the correct action attribute', async () => {
        expect(form.action).to.equal('http://example.com/monitoring-stations/123/untagging-licence/remove-tag-multiple');
      });

      test('the form has the POST method', async () => {
        expect(formBefore.method).to.equal('POST');
        expect(form.method).to.equal('POST');
      });

      test('the form has a radio button', async () => {
        const [selectedLicence] = form.fields;
        expect(selectedLicence.options.widget).to.equal('radio');
      });
    });
  });
});

'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const routes = require('internal/modules/gauging-stations/routes');
const controllers = require('internal/modules/gauging-stations/controller');
const preHandlers = require('internal/modules/gauging-stations/lib/prehandlers');
const helpers = require('internal/modules/gauging-stations/lib/helpers');

lab.experiment('/internal/modules/gauging-stations/routes', () => {
  lab.describe('.getMonitoringStation', () => {
    lab.test('has the right method', () => {
      expect(routes.getMonitoringStation.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getMonitoringStation.path).to.equal('/monitoring-stations/{gaugingStationId}');
    });
    lab.test('has the right controller', () => {
      expect(routes.getMonitoringStation.handler).to.equal(controllers.getMonitoringStation);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.getMonitoringStation.config.pre).to.equal([
        { method: preHandlers.loadGaugingStation, assign: 'station' },
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]);
    });
  });

  lab.describe('.getRemoveTags', () => {
    lab.test('has the right method', () => {
      expect(routes.getRemoveTags.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getRemoveTags.path).to.equal('/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag');
    });
    lab.test('has the right controller', () => {
      expect(routes.getRemoveTags.handler).to.equal(controllers.getRemoveTags);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.getRemoveTags.config.pre).to.equal([
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]);
    });
  });

  lab.describe('.getRemoveTagsConditions', () => {
    lab.test('has the right method', () => {
      expect(routes.getRemoveTagsConditions.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getRemoveTagsConditions.path).to.equal('/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-multiple');
    });
    lab.test('has the right controller', () => {
      expect(routes.getRemoveTagsConditions.handler).to.equal(controllers.getRemoveTagsConditions);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.getRemoveTagsConditions.config.pre).to.equal([
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]);
    });
  });

  lab.describe('.postRemoveTagsLicenceSelected', () => {
    lab.test('has the right method', () => {
      expect(routes.postRemoveTagsLicenceSelected.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postRemoveTagsLicenceSelected.path).to.equal('/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-multiple');
    });
    lab.test('has the right controller', () => {
      expect(routes.postRemoveTagsLicenceSelected.handler).to.equal(controllers.postRemoveTagsLicenceSelected);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.postRemoveTagsLicenceSelected.config.pre).to.equal([
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]);
    });
  });

  lab.describe('.postRemoveTag', () => {
    lab.test('has the right method', () => {
      expect(routes.postRemoveTag.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postRemoveTag.path).to.equal('/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag');
    });
    lab.test('has the right controller', () => {
      expect(routes.postRemoveTag.handler).to.equal(controllers.postRemoveTagOrMultiple);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.postRemoveTag.config.pre).to.equal([
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]);
    });
  });

  lab.describe('.getRemoveTagComplete', () => {
    lab.test('has the right method', () => {
      expect(routes.getRemoveTagComplete.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getRemoveTagComplete.path).to.equal('/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-complete');
    });
    lab.test('has the right controller', () => {
      expect(routes.getRemoveTagComplete.handler).to.equal(controllers.getRemoveTagComplete);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.getRemoveTagComplete.config.pre).to.equal([
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]);
    });
  });

  lab.describe('.postRemoveTagComplete', () => {
    lab.test('has the right method', () => {
      expect(routes.postRemoveTagComplete.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postRemoveTagComplete.path).to.equal('/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-complete');
    });
    lab.test('has the right controller', () => {
      expect(routes.postRemoveTagComplete.handler).to.equal(controllers.postRemoveTagComplete);
    });
  });

  lab.describe('.getNewTaggingFlow', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingFlow.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingFlow.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingFlow.handler).to.equal(controllers.getNewTaggingFlow);
    });
  });

  lab.describe('.getNewTaggingThresholdAndUnit', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingThresholdAndUnit.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingThresholdAndUnit.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/threshold-and-unit');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingThresholdAndUnit.handler).to.equal(controllers.getNewTaggingThresholdAndUnit);
    });
  });

  lab.describe('.postNewTaggingThresholdAndUnit', () => {
    lab.test('has the right method', () => {
      expect(routes.postNewTaggingThresholdAndUnit.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postNewTaggingThresholdAndUnit.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/threshold-and-unit');
    });
    lab.test('has the right controller', () => {
      expect(routes.postNewTaggingThresholdAndUnit.handler).to.equal(controllers.postNewTaggingThresholdAndUnit);
    });
  });

  lab.describe('.getNewTaggingAlertType', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingAlertType.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingAlertType.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/alert-type');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingAlertType.handler).to.equal(controllers.getNewTaggingAlertType);
    });
  });

  lab.describe('.postNewTaggingAlertType', () => {
    lab.test('has the right method', () => {
      expect(routes.postNewTaggingAlertType.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postNewTaggingAlertType.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/alert-type');
    });
    lab.test('has the right controller', () => {
      expect(routes.postNewTaggingAlertType.handler).to.equal(controllers.postNewTaggingAlertType);
    });
  });

  lab.describe('.getNewTaggingLicenceNumber', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingLicenceNumber.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingLicenceNumber.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/licence-number');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingLicenceNumber.handler).to.equal(controllers.getNewTaggingLicenceNumber);
    });
  });

  lab.describe('.postNewTaggingLicenceNumber', () => {
    lab.test('has the right method', () => {
      expect(routes.postNewTaggingLicenceNumber.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postNewTaggingLicenceNumber.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/licence-number');
    });
    lab.test('has the right controller', () => {
      expect(routes.postNewTaggingLicenceNumber.handler).to.equal(controllers.postNewTaggingLicenceNumber);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.postNewTaggingLicenceNumber.config.pre).to.equal([
        { method: helpers.isLicenceNumberValid, assign: 'isLicenceNumberValid' }
      ]);
    });
  });

  lab.describe('.getNewTaggingCondition', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingCondition.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingCondition.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/condition');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingCondition.handler).to.equal(controllers.getNewTaggingCondition);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.getNewTaggingCondition.config.pre).to.equal([
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]);
    });
  });

  lab.describe('.postNewTaggingCondition', () => {
    lab.test('has the right method', () => {
      expect(routes.postNewTaggingCondition.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postNewTaggingCondition.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/condition');
    });
    lab.test('has the right controller', () => {
      expect(routes.postNewTaggingCondition.handler).to.equal(controllers.postNewTaggingCondition);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.postNewTaggingCondition.config.pre).to.equal([
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]);
    });
  });

  lab.describe('.getNewTaggingManuallyDefinedAbstractionPeriod', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingManuallyDefinedAbstractionPeriod.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingManuallyDefinedAbstractionPeriod.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/abstraction-period');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingManuallyDefinedAbstractionPeriod.handler).to.equal(controllers.getNewTaggingManuallyDefinedAbstractionPeriod);
    });
  });

  lab.describe('.postNewTaggingManuallyDefinedAbstractionPeriod', () => {
    lab.test('has the right method', () => {
      expect(routes.postNewTaggingManuallyDefinedAbstractionPeriod.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postNewTaggingManuallyDefinedAbstractionPeriod.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/abstraction-period');
    });
    lab.test('has the right controller', () => {
      expect(routes.postNewTaggingManuallyDefinedAbstractionPeriod.handler).to.equal(controllers.postNewTaggingManuallyDefinedAbstractionPeriod);
    });
  });

  lab.describe('.getNewTaggingCheckYourAnswers', () => {
    lab.test('has the right method', () => {
      expect(routes.getNewTaggingCheckYourAnswers.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getNewTaggingCheckYourAnswers.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/check');
    });
    lab.test('has the right controller', () => {
      expect(routes.getNewTaggingCheckYourAnswers.handler).to.equal(controllers.getNewTaggingCheckYourAnswers);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.postNewTaggingCondition.config.pre).to.equal([
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]);
    });
  });

  lab.describe('.postNewTaggingCheckYourAnswers', () => {
    lab.test('has the right method', () => {
      expect(routes.postNewTaggingCheckYourAnswers.method).to.equal('POST');
    });
    lab.test('has the right path', () => {
      expect(routes.postNewTaggingCheckYourAnswers.path).to.equal('/monitoring-stations/{gaugingStationId}/tagging-licence/check');
    });
    lab.test('has the right controller', () => {
      expect(routes.postNewTaggingCheckYourAnswers.handler).to.equal(controllers.postNewTaggingCheckYourAnswers);
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.postNewTaggingCondition.config.pre).to.equal([
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]);
    });
  });

  lab.describe('.getSendAlert', () => {
    lab.test('has the right method', () => {
      expect(routes.getSendAlert.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getSendAlert.path).to.equal('/monitoring-stations/{gaugingStationId}/send-alert');
    });
  });

  lab.describe('.getSendAlertSelectAlertType', () => {
    lab.test('has the right method', () => {
      expect(routes.getSendAlertSelectAlertType.method).to.equal('GET');
    });
    lab.test('has the right path', () => {
      expect(routes.getSendAlertSelectAlertType.path).to.equal('/monitoring-stations/{gaugingStationId}/send-alert/alert-type');
    });
    lab.test('has the correct prehandlers', () => {
      expect(routes.getSendAlertSelectAlertType.config.pre).to.equal([
        { method: preHandlers.loadGaugingStation, assign: 'station' }
      ]);
    });
  });
});

'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const chargeInformationValidator = require('internal/modules/charge-information/lib/charge-information-validator');

const getElement = (chargeInfo, id) =>
  chargeInfo.chargeElements.find(element => element.id === id);

const createChargeElement = (options = {}) => ({
  id: options.id,
  season: options.season || 'all year',
  abstractionPeriod: {
    startDay: 1,
    startMonth: 4,
    endDay: 31,
    endMonth: 3
  },
  purposeUse: {
    lossFactor: 'low'
  },
  loss: options.loss || 'low',
  authorisedAnnualQuantity: 1234,
  billableAnnualQuantity: options.billableQuantity || 1111
});

experiment('internal/modules/charge-information/lib/charge-information-validator', () => {
  experiment('.addValidation', () => {
    let chargeInfo, decoratedChargeInfo;
    beforeEach(() => {
      chargeInfo = {
        chargeElements: [
          createChargeElement({
            id: 'compliant-element'
          }),
          createChargeElement({
            id: 'abstraction-period-warning',
            season: 'summer'
          }),
          createChargeElement({
            id: 'loss-factor-warning',
            loss: 'medium'
          }),
          createChargeElement({
            id: 'billable-volume-warning',
            billableQuantity: 4567
          }),
          createChargeElement({
            id: 'multiple-warnings',
            season: 'summer',
            loss: 'medium'
          })
        ] };
      decoratedChargeInfo = chargeInformationValidator.addValidation(chargeInfo);
    });
    test('validation warnings are blank for compliant elements', () => {
      const { validationWarnings } = getElement(decoratedChargeInfo, 'compliant-element');
      expect(validationWarnings).to.equal([]);
    });

    test('when the season and abs period don\'t match, the expected validation warning is present', () => {
      const { validationWarnings } = getElement(decoratedChargeInfo, 'abstraction-period-warning');
      expect(validationWarnings).to.equal(['The abstraction period does not match the season selected']);
    });

    test('when the loss and purpose use loss factor don\'t match, the expected validation warning is present', () => {
      const { validationWarnings } = getElement(decoratedChargeInfo, 'loss-factor-warning');
      expect(validationWarnings).to.equal(['The loss factor does not match the purpose selected']);
    });

    test('when the billable quantity is higher than authorised quantity, the expected validation warning is present', () => {
      const { validationWarnings } = getElement(decoratedChargeInfo, 'billable-volume-warning');
      expect(validationWarnings).to.equal(['The billable volume exceeds the authorised volume']);
    });

    test('when there are multiple warnings, all warnings are present', () => {
      const { validationWarnings } = getElement(decoratedChargeInfo, 'multiple-warnings');
      expect(validationWarnings).to.equal([
        'The abstraction period does not match the season selected',
        'The loss factor does not match the purpose selected'
      ]);
    });
  });
});

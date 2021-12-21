const { getAbstractionPeriodSeason } = require('@envage/water-abstraction-helpers').returns.date;

const isMatchingAbstractionPeriodAndSeason = chargeElement => {
  const { abstractionPeriod, season } = chargeElement;
  const absPeriodSeason = getAbstractionPeriodSeason(abstractionPeriod);
  return absPeriodSeason === season;
};

const isDefaultLossFactor = chargeElement => {
  const { loss, purposeUse } = chargeElement;
  return loss === purposeUse.lossFactor;
};

const isBillableVolumeLessThanAuthorisedVolume = chargeElement =>
  chargeElement.billableAnnualQuantity <= chargeElement.authorisedAnnualQuantity;

const validations = {
  abstractionPeriod: {
    validatorFunc: isMatchingAbstractionPeriodAndSeason,
    warningMessage: 'The abstraction period does not match the season selected' },
  lossFactor: {
    validatorFunc: isDefaultLossFactor,
    warningMessage: 'The loss factor does not match the purpose selected'
  },
  billableVolume: {
    validatorFunc: isBillableVolumeLessThanAuthorisedVolume,
    warningMessage: 'The billable quantity is more than the authorised quantity' }
};

const validate = chargeElement =>
  Object.values(validations).reduce((validationWarnings, validation) => {
    if (!validation.validatorFunc(chargeElement)) {
      validationWarnings.push(validation.warningMessage);
    }
    return validationWarnings;
  }, []);

const addValidation = chargeInformation => {
  const chargeElementsWithValidationWarnings = chargeInformation.chargeElements.map(element => ({
    ...(element.chargePurposes
      ? {
        ...element,
        chargePurposes: element.chargePurposes.map(purpose => ({
          ...purpose,
          validationWarnings: validate(purpose)
        }))
      }
      : element),
    validationWarnings: chargeInformation.chargingScheme === 'presroc'
      ? validate(element)
      : [] // a new validator for @SROC will have to be added here
  }));
  return {
    ...chargeInformation,
    chargeElements: chargeElementsWithValidationWarnings
  };
};

exports.addValidation = addValidation;

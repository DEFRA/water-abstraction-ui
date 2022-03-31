'use-strict';

const SOURCES = {
  tidal: 'tidal',
  nonTidal: 'non-tidal'
};

const WATER_MODEL = {
  noModel: 'no model',
  tier1: 'tier 1',
  tier2: 'tier 2'
};

const LOSS_CATEGORIES = {
  high: 'high',
  medium: 'medium',
  low: 'low'
};

const IS_RESTRICTED_SOURCE = [
  {
    label: 'available',
    value: false
  },
  {
    label: 'restricted availablity or no availability',
    value: true
  }
];

const YES_NO = [
  {
    label: 'yes',
    value: true
  },
  {
    label: 'no',
    value: false
  }
];
const ADJUSTMENTS = [
  { title: 'Aggregate', value: 'aggregate', hasFactor: true },
  { title: 'Charge adjustment', value: 'charge', hasFactor: true },
  { title: 'Winter discount', value: 'winter', hasFactor: false },
  { title: 'Two-part tariff agreement', value: 's127', hasFactor: false },
  { title: 'Abatement agreement', value: 's126', hasFactor: true, hint: 'If a licence charge is reduced by 70% the abatement factor is 0.3' },
  { title: 'Canal and River Trust agreement', value: 's130', hasFactor: false }
];

/**
 * flowConfig is used to define the
 * -- pageTitle = the title of the page displayed with the form
 * -- nextStep  = the next page to load
 */
const ROUTING_CONFIG = {
  whichElement: {
    step: 'which-element',
    pageTitle: 'Assign charge reference to',
    caption: 'Select all that apply',
    nextStep: 'description',
    errorMessage: 'Select all that apply'
  },
  description: {
    step: 'description',
    pageTitle: 'Enter a description for the charge reference',
    nextStep: 'source',
    back: 'whichElement'
  },
  source: {
    step: 'source',
    pageTitle: 'Select the source',
    nextStep: 'loss',
    back: 'description',
    options: SOURCES,
    errorMessage: 'Select if the source is tidal or non-tidal.'
  },
  loss: {
    step: 'loss',
    pageTitle: 'Select the loss',
    nextStep: 'volume',
    back: 'source',
    options: LOSS_CATEGORIES,
    errorMessage: 'Select if the loss is high, medium or low.'
  },
  volume: {
    step: 'volume',
    pageTitle: 'Enter a volume',
    nextStep: 'isRestrictedSource',
    back: 'loss'
  },
  isRestrictedSource: {
    step: 'restricted-source',
    pageTitle: 'Select the water availability',
    nextStep: 'waterModel',
    back: 'volume',
    options: IS_RESTRICTED_SOURCE,
    errorMessage: 'Select the water availability.',
    boolean: true
  },
  waterModel: {
    step: 'water-model',
    pageTitle: 'Select the water modelling charge',
    nextStep: 'isAdditionalCharges',
    back: 'isRestrictedSource',
    options: WATER_MODEL,
    errorMessage: 'Select the water modelling charge.'
  },
  isAdditionalCharges: {
    step: 'additional-charges',
    pageTitle: 'Do additional charges apply?',
    caption: 'Select \'yes\' if the licence is for the supply of public water or abstraction from a supported source such as a reservoir.',
    nextStep: 'isAdjustments',
    nextStepYes: 'isSupportedSource',
    back: 'waterModel',
    options: YES_NO,
    errorMessage: 'Select \'yes\' if additional charges apply.',
    boolean: true
  },
  isSupportedSource: {
    step: 'supported-source',
    pageTitle: 'Is abstraction from a supported source?',
    caption: 'These are water sources the EA pays an additional charge to access, for example Glen Groundwater.',
    back: 'isAdditionalCharges',
    nextStep: 'isSupplyPublicWater',
    nextStepYes: 'supportedSourceName',
    options: YES_NO,
    errorMessage: 'Select \'yes\' if abstraction is from a supported source.',
    boolean: true
  },
  supportedSourceName: {
    step: 'supported-source-name',
    pageTitle: 'Select the name of the supported source',
    back: 'isSupportedSource',
    nextStep: 'isSupplyPublicWater',
    errorMessage: 'Select the name of the supported source.',
    boolean: true
  },
  isSupplyPublicWater: {
    step: 'supply-public-water',
    pageTitle: 'Is abstraction for the supply of public water?',
    caption: 'In the case of a permit authorising a water abstraction activity held by a water undertaker carrying out its statutory functions',
    back: 'isSupportedSource',
    nextStep: 'isAdjustments',
    options: YES_NO,
    errorMessage: 'Select \'yes\' if abstraction is for the supply of public water.',
    boolean: true
  },
  isAdjustments: {
    step: 'adjustments-apply',
    pageTitle: 'Do adjustments apply?',
    back: 'isAdditionalCharges',
    options: YES_NO,
    errorMessage: 'Select \'yes\' if adjustments apply.',
    boolean: true,
    nextStep: 'adjustments'
  },
  adjustments: {
    step: 'adjustments',
    pageTitle: 'Which adjustments apply?',
    back: 'isAdjustments',
    options: ADJUSTMENTS
  }
};

// Replace the routing config strings with the step value for the matching config
Object.values(ROUTING_CONFIG).forEach(config => {
  ['nextStep', 'nextStepYes', 'back'].forEach(prop => {
    if (config[prop]) {
      config[prop] = ROUTING_CONFIG[config[prop]].step;
    }
  });
});

const getStepKeyByValue = value => Object.keys(ROUTING_CONFIG).find(key => ROUTING_CONFIG[key].step === value);

exports.WATER_MODEL = WATER_MODEL;
exports.IS_RESTRICTED_SOURCE = IS_RESTRICTED_SOURCE;
exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.ROUTING_CONFIG = ROUTING_CONFIG;
exports.getStepKeyByValue = getStepKeyByValue;

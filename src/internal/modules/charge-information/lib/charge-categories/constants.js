'use-strict';

const CHARGE_CATEGORY_STEPS = {
  description: 'description',
  source: 'source',
  loss: 'loss',
  volume: 'volume',
  isRestrictedSource: 'restricted-source',
  waterModel: 'water-model',
  isAdditionalCharges: 'additional-charges',
  isAdjustments: 'adjustments'
};

const getStepKeyByValue = value => Object.keys(CHARGE_CATEGORY_STEPS).find(key => CHARGE_CATEGORY_STEPS[key] === value);

const CHARGE_CATEGORY_FIRST_STEP = CHARGE_CATEGORY_STEPS.description;

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
    label: 'restricted availablity or no availability',
    value: true
  },
  {
    label: 'available',
    value: false
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

/**
 * flowConfig is used to define the
 * -- pageTitle = the title of the page displayed with the form
 * -- nextStep  = the next page to load
 */
const ROUTING_CONFIG = {
  description: {
    pageTitle: 'Enter a description for the charge reference',
    nextStep: CHARGE_CATEGORY_STEPS.source
  },
  source: {
    pageTitle: 'Select the source',
    nextStep: CHARGE_CATEGORY_STEPS.loss,
    back: CHARGE_CATEGORY_STEPS.description,
    options: SOURCES,
    errorMessage: 'Select if the source is tidal or non-tidal.'
  },
  loss: {
    pageTitle: 'Select the loss',
    nextStep: CHARGE_CATEGORY_STEPS.volume,
    back: CHARGE_CATEGORY_STEPS.source,
    options: LOSS_CATEGORIES,
    errorMessage: 'Select if the loss is high, medium or low.'
  },
  volume: {
    pageTitle: 'Enter a volume',
    nextStep: CHARGE_CATEGORY_STEPS.isRestrictedSource,
    back: CHARGE_CATEGORY_STEPS.loss
  },
  isRestrictedSource: {
    pageTitle: 'Select the water availability',
    nextStep: CHARGE_CATEGORY_STEPS.waterModel,
    back: CHARGE_CATEGORY_STEPS.volume,
    options: IS_RESTRICTED_SOURCE,
    errorMessage: 'Select the water availability.',
    boolean: true
  },
  waterModel: {
    pageTitle: 'Select the water model',
    nextStep: CHARGE_CATEGORY_STEPS.isAdditionalCharges,
    back: CHARGE_CATEGORY_STEPS.isRestrictedSource,
    options: WATER_MODEL,
    errorMessage: 'Select the water model.'
  },
  isAdditionalCharges: {
    pageTitle: 'Do additional charges apply?',
    nextStep: CHARGE_CATEGORY_STEPS.isAdjustments,
    back: CHARGE_CATEGORY_STEPS.waterModel,
    options: YES_NO,
    errorMessage: 'Select \'yes\' if additional charges apply.',
    boolean: true
  },
  isAdjustments: {
    pageTitle: 'Do adjustments apply?',
    back: CHARGE_CATEGORY_STEPS.isAdditionalCharges,
    options: YES_NO,
    errorMessage: 'Select \'yes\' if adjustments apply.',
    boolean: true
  }
};

exports.WATER_MODEL = WATER_MODEL;
exports.IS_RESTRICTED_SOURCE = IS_RESTRICTED_SOURCE;
exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.ROUTING_CONFIG = ROUTING_CONFIG;
exports.CHARGE_CATEGORY_STEPS = CHARGE_CATEGORY_STEPS;
exports.CHARGE_CATEGORY_FIRST_STEP = CHARGE_CATEGORY_FIRST_STEP;
exports.getStepKeyByValue = getStepKeyByValue;

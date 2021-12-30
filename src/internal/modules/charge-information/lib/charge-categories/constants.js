const CHARGE_CATEGORY_STEPS = {
  description: 'description',
  source: 'source',
  loss: 'loss',
  volume: 'volume',
  waterAvailability: 'water-availability',
  waterModel: 'water-model',
  additionalChargesApply: 'additional-charges-apply',
  adjustmentsApply: 'adjustments-apply'
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

const WATER_AVAILABILITY = {
  available: 'available',
  restricted: 'restricted availablity or no availability'
};

const YES_NO = {
  // true: 'Yes',
  false: 'no'
};

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
    errorMessage: 'Select a source'
  },
  loss: {
    pageTitle: 'Select the loss',
    nextStep: CHARGE_CATEGORY_STEPS.volume,
    back: CHARGE_CATEGORY_STEPS.source,
    options: LOSS_CATEGORIES,
    errorMessage: 'Select a loss category' },
  volume: {
    pageTitle: 'Enter a volume',
    nextStep: CHARGE_CATEGORY_STEPS.waterAvailability,
    back: CHARGE_CATEGORY_STEPS.loss
  },
  waterAvailability: {
    pageTitle: 'Select the water availability',
    nextStep: CHARGE_CATEGORY_STEPS.waterModel,
    back: CHARGE_CATEGORY_STEPS.volume,
    options: WATER_AVAILABILITY,
    errorMessage: 'Select the water availability'
  },
  waterModel: {
    pageTitle: 'Select the water model',
    nextStep: CHARGE_CATEGORY_STEPS.additionalChargesApply,
    back: CHARGE_CATEGORY_STEPS.waterAvailability,
    options: WATER_MODEL,
    errorMessage: 'Select the watet model'
  },
  additionalChargesApply: {
    pageTitle: 'Do additional charges apply?',
    nextStep: CHARGE_CATEGORY_STEPS.adjustmentsApply,
    back: CHARGE_CATEGORY_STEPS.waterModel,
    options: YES_NO,
    errorMessage: 'Select yes if additional charges apply.' },
  adjustmentsApply: {
    pageTitle: 'Do adjustments apply?',
    back: CHARGE_CATEGORY_STEPS.additionalChargesApply,
    options: YES_NO,
    errorMessage: 'Select yes if adjustments apply'
  }
};

exports.WATER_MODEL = WATER_MODEL;
exports.WATER_AVAILABILITY = WATER_AVAILABILITY;
exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.ROUTING_CONFIG = ROUTING_CONFIG;
exports.CHARGE_CATEGORY_STEPS = CHARGE_CATEGORY_STEPS;
exports.CHARGE_CATEGORY_FIRST_STEP = CHARGE_CATEGORY_FIRST_STEP;
exports.getStepKeyByValue = getStepKeyByValue;

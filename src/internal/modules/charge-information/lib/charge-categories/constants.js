const CHARGE_CATEGORY_STEPS = {
  description: 'description',
  source: 'source',
  loss: 'loss',
  volume: 'volume',
  availability: 'availability',
  model: 'model',
  charges: 'charges',
  adjustments: 'adjustments'
};

const CHARGE_CATEGORY_FIRST_STEP = CHARGE_CATEGORY_STEPS.description;

const SOURCES = {
  tidal: 'Tidal',
  nonTidal: 'Non-tidal'
};

const WATER_MODEL = {
  noModel: 'No model',
  tier1: 'Tier 1',
  tier2: 'Tier 2'
};

const LOSS_CATEGORIES = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

const WATER_AVAILABILITY = {
  available: 'Available',
  restricted: 'Restricted availablity or no availability'
};

const YES_NO = {
  // true: 'Yes',
  false: 'No'
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
    nextStep: CHARGE_CATEGORY_STEPS.availability,
    back: CHARGE_CATEGORY_STEPS.loss
  },
  availability: {
    pageTitle: 'Select the water availability',
    nextStep: CHARGE_CATEGORY_STEPS.model,
    back: CHARGE_CATEGORY_STEPS.volume,
    options: WATER_AVAILABILITY,
    errorMessage: 'Select the water availability'
  },
  model: {
    pageTitle: 'Select the water model',
    nextStep: CHARGE_CATEGORY_STEPS.charges,
    back: CHARGE_CATEGORY_STEPS.availability,
    options: WATER_MODEL,
    errorMessage: 'Select the watet model'
  },
  charges: {
    pageTitle: 'Do additional charges apply?',
    nextStep: CHARGE_CATEGORY_STEPS.adjustments,
    back: CHARGE_CATEGORY_STEPS.model,
    options: YES_NO,
    errorMessage: 'Select yes if additional charges apply.' },
  adjustments: {
    pageTitle: 'Do adjustments apply?',
    back: CHARGE_CATEGORY_STEPS.charges,
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

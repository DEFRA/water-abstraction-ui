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

/**
 * flowConfig is used to define the
 * -- pageTitle = the title of the page displayed with the form
 * -- nextStep  = the next page to load
 */
const ROUTING_CONFIG = {
  description: { pageTitle: 'Enter a description for the charge reference', nextStep: CHARGE_CATEGORY_STEPS.source },
  source: { pageTitle: 'Select the source', nextStep: CHARGE_CATEGORY_STEPS.loss, back: CHARGE_CATEGORY_STEPS.description },
  loss: { pageTitle: 'Select the loss', nextStep: CHARGE_CATEGORY_STEPS.volume, back: CHARGE_CATEGORY_STEPS.source },
  volume: { pageTitle: 'Enter a volume', nextStep: CHARGE_CATEGORY_STEPS.availability, back: CHARGE_CATEGORY_STEPS.loss },
  availability: { pageTitle: 'Select the water availability', nextStep: CHARGE_CATEGORY_STEPS.model, back: CHARGE_CATEGORY_STEPS.availability },
  model: { pageTitle: 'Select the water model', nextStep: CHARGE_CATEGORY_STEPS.charges, back: CHARGE_CATEGORY_STEPS.model },
  charges: { pageTitle: 'Do additional charges apply?', nextStep: CHARGE_CATEGORY_STEPS.adjustments, back: CHARGE_CATEGORY_STEPS.model },
  adjustments: { pageTitle: 'Do adjustments apply?', back: CHARGE_CATEGORY_STEPS.charges }
};

const LOSS_HIGH = 'High';
const LOSS_MEDIUM = 'Medium';
const LOSS_LOW = 'Low';

const AVAILABLE = 'Available';
const RESTRICTED = 'Restricted availablity or no availability';

const WATER_MODEL = {
  noModel: 'No model',
  tier1: 'Tier 1',
  tier2: 'Tier 2'
};

const SOURCES = {
  tidal: 'Tidal',
  nonTidal: 'Non-tidal'
};

const LOSS_CATEGORIES = [LOSS_HIGH, LOSS_MEDIUM, LOSS_LOW];
const WATER_AVAILABILITY = [AVAILABLE, RESTRICTED];

exports.WATER_MODEL = WATER_MODEL;
exports.WATER_AVAILABILITY = WATER_AVAILABILITY;
exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.ROUTING_CONFIG = ROUTING_CONFIG;
exports.CHARGE_CATEGORY_STEPS = CHARGE_CATEGORY_STEPS;
exports.CHARGE_CATEGORY_FIRST_STEP = CHARGE_CATEGORY_FIRST_STEP;

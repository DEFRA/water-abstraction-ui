const CHARGE_CATEGORY_STEPS = {
  description: 'description',
  source: 'source',
  loss: 'loss',
  quantity: 'quantity',
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
  loss: { pageTitle: 'Select the loss', nextStep: CHARGE_CATEGORY_STEPS.quantity, back: CHARGE_CATEGORY_STEPS.source },
  quantity: { pageTitle: 'Enter a quantity', nextStep: CHARGE_CATEGORY_STEPS.availability, back: CHARGE_CATEGORY_STEPS.loss },
  availability: { pageTitle: 'Select the water availability', nextStep: CHARGE_CATEGORY_STEPS.model, back: CHARGE_CATEGORY_STEPS.availability },
  model: { pageTitle: 'Select the water model', nextStep: CHARGE_CATEGORY_STEPS.charges, back: CHARGE_CATEGORY_STEPS.model },
  charges: { pageTitle: 'Do additional charges apply?', nextStep: CHARGE_CATEGORY_STEPS.adjustments, back: CHARGE_CATEGORY_STEPS.model },
  adjustments: { pageTitle: 'Do adjustments apply?', nextStep: CHARGE_CATEGORY_STEPS.description, back: CHARGE_CATEGORY_STEPS.charges }
};

const LOSS_HIGH = 'high';
const LOSS_MEDIUM = 'medium';
const LOSS_LOW = 'low';

const SEASON_SUMMER = 'summer';
const SEASON_WINTER = 'winter';
const SEASON_ALL_YEAR = 'all year';

const AVAILABLE = 'available';
const RESTRICTED = 'restricted availablity or no availability';

const WATER_MODEL = {
  noModel: 'no model',
  tier1: 'Groundwater or surface water tier 1',
  tier2: 'Groundwater or surface water tier 2'
};

const SOURCES = {
  tidal: 'tidal',
  nonTidal: 'non-tidal'
};

const LOSS_CATEGORIES = [LOSS_HIGH, LOSS_MEDIUM, LOSS_LOW];
const SEASONS = [SEASON_SUMMER, SEASON_WINTER, SEASON_ALL_YEAR];
const WATER_AVAILABILITY = [AVAILABLE, RESTRICTED];

exports.WATER_MODEL = WATER_MODEL;
exports.WATER_AVAILABILITY = WATER_AVAILABILITY;
exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.SEASONS = SEASONS;
exports.ROUTING_CONFIG = ROUTING_CONFIG;
exports.CHARGE_CATEGORY_STEPS = CHARGE_CATEGORY_STEPS;
exports.CHARGE_CATEGORY_FIRST_STEP = CHARGE_CATEGORY_FIRST_STEP;

const CHARGE_ELEMENT_STEPS = {
  purpose: 'purpose',
  description: 'description',
  abstractionPeriod: 'abstraction',
  quantities: 'quantities',
  timeLimit: 'time',
  source: 'source',
  season: 'season',
  loss: 'loss'
};

const CHARGE_ELEMENT_FIRST_STEP = CHARGE_ELEMENT_STEPS.purpose;
const CHARGE_ELEMENT_LAST_STEP = CHARGE_ELEMENT_STEPS.loss;

/**
 * flowConfig is used to define the
 * -- pageTitle = the title of the page displayed with the form
 * -- nextStep  = the next page to load
 */
const ROUTING_CONFIG = {
  purpose: { pageTitle: 'Select a purpose use', nextStep: CHARGE_ELEMENT_STEPS.description },
  description: { pageTitle: 'Add element description', nextStep: CHARGE_ELEMENT_STEPS.abstractionPeriod, back: CHARGE_ELEMENT_STEPS.purpose },
  abstraction: { pageTitle: 'Set abstraction period', nextStep: CHARGE_ELEMENT_STEPS.quantities, back: CHARGE_ELEMENT_STEPS.description },
  quantities: { pageTitle: 'Add annual quantities', nextStep: CHARGE_ELEMENT_STEPS.timeLimit, back: CHARGE_ELEMENT_STEPS.abstractionPeriod },
  time: { pageTitle: 'Set time limit?', nextStep: CHARGE_ELEMENT_STEPS.source, back: CHARGE_ELEMENT_STEPS.quantities },
  source: { pageTitle: 'Select source', nextStep: CHARGE_ELEMENT_STEPS.season, back: CHARGE_ELEMENT_STEPS.timeLimit },
  season: { pageTitle: 'Select season', nextStep: CHARGE_ELEMENT_STEPS.loss, back: CHARGE_ELEMENT_STEPS.source },
  loss: { pageTitle: 'Select loss category', back: CHARGE_ELEMENT_STEPS.season }
};

const LOSS_HIGH = 'high';
const LOSS_MEDIUM = 'medium';
const LOSS_LOW = 'low';
const LOSS_VERY_LOW = 'very low';
const SEASON_SUMMER = 'summer';
const SEASON_WINTER = 'winter';
const SEASON_ALL_YEAR = 'all year';

const EIUC_SOURCE_OTHER = 'other';
const SOURCES = {
  unsupported: 'unsupported',
  supported: 'supported',
  tidal: 'tidal',
  kielder: 'kielder'
};

const LOSS_CATEGORIES = [LOSS_HIGH, LOSS_MEDIUM, LOSS_LOW, LOSS_VERY_LOW];
const SEASONS = [SEASON_SUMMER, SEASON_WINTER, SEASON_ALL_YEAR];

exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.SEASONS = SEASONS;
exports.EIUC_SOURCE_OTHER = EIUC_SOURCE_OTHER;
exports.ROUTING_CONFIG = ROUTING_CONFIG;
exports.CHARGE_ELEMENT_STEPS = CHARGE_ELEMENT_STEPS;
exports.CHARGE_ELEMENT_FIRST_STEP = CHARGE_ELEMENT_FIRST_STEP;
exports.CHARGE_ELEMENT_LAST_STEP = CHARGE_ELEMENT_LAST_STEP;

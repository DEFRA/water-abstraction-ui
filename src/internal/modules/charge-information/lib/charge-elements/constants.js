/**
 * flowConfig is used to define the
 * -- pageTitle = the title of the page displayed with the form
 * -- nextStep  = the next page to load
 */
const ROUTING_CONFIG = {
  purpose: { pageTitle: 'Select a purpose use', nextStep: 'description' },
  description: { pageTitle: 'Add element description', nextStep: 'abstraction', back: 'purpose' },
  abstraction: { pageTitle: 'Set abstraction period', nextStep: 'quantities', back: 'description' },
  quantities: { pageTitle: 'Add licence quantities', nextStep: 'time', back: 'abstraction' },
  time: { pageTitle: 'Set time limit?', nextStep: 'source', back: 'quantities' },
  source: { pageTitle: 'Select source', nextStep: 'season', back: 'time' },
  season: { pageTitle: 'Select season', nextStep: 'loss', back: 'source' },
  loss: { pageTitle: 'Select loss category', nextStep: 'loss', back: 'season' }
};

const LOSS_HIGH = 'high';
const LOSS_MEDIUM = 'medium';
const LOSS_LOW = 'low';
const LOSS_VERY_LOW = 'very low';
const SOURCE_UNSUPPORTED = 'unsupported';
const SOURCE_SUPPORTED = 'supported';
const SOURCE_TIDAL = 'tidal';
const SOURCE_KIELDER = 'kielder';
const SEASON_SUMMER = 'summer';
const SEASON_WINTER = 'winter';
const SEASON_ALL_YEAR = 'all year';

const LOSS_CATEGORIES = [LOSS_HIGH, LOSS_MEDIUM, LOSS_LOW, LOSS_VERY_LOW];
const SOURCES = [SOURCE_UNSUPPORTED, SOURCE_SUPPORTED, SOURCE_TIDAL, SOURCE_KIELDER];
const SEASONS = [SEASON_SUMMER, SEASON_WINTER, SEASON_ALL_YEAR];

exports.LOSS_CATEGORIES = LOSS_CATEGORIES;
exports.SOURCES = SOURCES;
exports.SEASONS = SEASONS;
exports.ROUTING_CONFIG = ROUTING_CONFIG;

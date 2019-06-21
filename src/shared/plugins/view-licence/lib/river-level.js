const { find, has } = require('lodash');

const isLevelMeasure = measure => measure.parameter === 'level';
const isFlowMeasure = measure => measure.parameter === 'flow';
const hasLatestReading = measure => has(measure, 'latestReading.value');

/**
 * Automatically select flow/level depending on the HoF types in the licence
 * @param {Object} flow - flow measure from API data
 * @param {Object} level - level measure from API data
 * @param {Object} hofTypes - HoF types with booleans for cesLev and cesFlow
 */
function autoSelectRiverLevelMeasure (flow, level, hofTypes) {
  if (flow && hofTypes.cesFlow) {
    return flow;
  }
  if (level && hofTypes.cesLev) {
    return level;
  }
}

/**
 * Logic for selecting which measure to display:
 * - if only 1 measure from station, show that
 * - if 2 measures, and 1 hof type, show the matching one
 * - if 2 measures, and 2 hof types, show flow
 * @param {Object} riverLevel - data returned from water river level API
 * @param {Object} hofTypes - HOF types in licence
 * @param {String} mode - can be flow|level|auto.  If auto, determined by hof types
 * @return {Object} measure the selected measure - level/flow
 */
function selectRiverLevelMeasure (riverLevel, hofTypes, mode = 'auto') {
  const flow = find(riverLevel.measures, measure => {
    return isFlowMeasure(measure) && hasLatestReading(measure);
  });

  const level = find(riverLevel.measures, measure => {
    return isLevelMeasure(measure) && hasLatestReading(measure);
  });

  switch (mode) {
    case 'auto':
      return autoSelectRiverLevelMeasure(flow, level, hofTypes);

    case 'level':
      return level;

    case 'flow':
      return flow;
  }
}

exports.selectRiverLevelMeasure = selectRiverLevelMeasure;

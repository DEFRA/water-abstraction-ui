const { get } = require('lodash');

const isMeterDetailsProvided = data =>
  get(data, 'meters[0].meterDetailsProvided', false);

const isVolumes = data =>
  get(data, 'reading.method') === 'abstractionVolumes';

const isOneMeter = data =>
  get(data, 'reading.method') === 'oneMeter';

const isNil = data => get(data, 'isNil', false);

const isSingleTotal = data => get(data, 'reading.totalFlag', false);

const isMeasured = data => get(data, 'reading.type') === 'measured';

exports.isMeterDetailsProvided = isMeterDetailsProvided;
exports.isVolumes = isVolumes;
exports.isOneMeter = isOneMeter;
exports.isNil = isNil;
exports.isSingleTotal = isSingleTotal;
exports.isMeasured = isMeasured;

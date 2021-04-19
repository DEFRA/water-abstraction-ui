'use strict';

const mapReturnCycle = returnCycle => ({
  totalExcludingVoid: parseInt(returnCycle.totalCount) - parseInt(returnCycle.voidCount),
  ...returnCycle
});

exports.mapReturnCycle = mapReturnCycle;

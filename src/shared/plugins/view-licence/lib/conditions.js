const isLevelCondition = condition =>
  (condition.code === 'CES' && condition.subCode === 'LEV');

const isFlowCondition = condition =>
  (condition.code === 'CES' && condition.subCode === 'FLOW');

const isHoF = condition => isLevelCondition(condition) || isFlowCondition(condition);

const getHoFTypes = (conditions = []) => ({
  cesFlow: conditions.filter(isFlowCondition).length > 0,
  cesLev: conditions.filter(isLevelCondition).length > 0
});

exports.isLevelCondition = isLevelCondition;
exports.isFlowCondition = isFlowCondition;
exports.isHoF = isHoF;
exports.getHoFTypes = getHoFTypes;

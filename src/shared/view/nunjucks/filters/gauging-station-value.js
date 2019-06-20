module.exports.gaugingStationValue = (measure, convertTo) => {
  const { unitName, latestReading: { value } } = measure;

  // Flows - convert to m3/day
  if (unitName === 'm3/s') {
    if (convertTo === 'm3/day') {
      return `${(value * 86400).toFixed(1)}m³/day`;
    }

    return `${(value).toFixed(1)}m³/s`;

    // return `${(value * 86400).toFixed(1)}m³/day`;
  }

  // Levels in mASD - convert to level in m
  if (unitName === 'mASD') {
    return `${(value).toFixed(2)}m`;
  }

  // Unknown unit - return as is
  return `${value}${unitName}`;
};

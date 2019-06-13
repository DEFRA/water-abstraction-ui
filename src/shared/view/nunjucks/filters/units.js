
const map = {
  'm³': 'Cubic metres',
  'gal': 'Gallons',
  'l': 'Litres',
  'Ml': 'Megalitres'
};

const units = (key) => {
  return map[key];
};

module.exports = {
  units
};

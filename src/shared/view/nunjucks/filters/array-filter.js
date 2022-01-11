const arrayFilter = (array, id, val) =>
  array.filter(row => row[id] === val);

exports.arrayFilter = arrayFilter;

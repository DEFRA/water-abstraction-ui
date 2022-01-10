const arrayFilter = (array, id, val) => {
  const vals = array.filter(row => row[id] === val);
  return vals;
};

exports.arrayFilter = arrayFilter;

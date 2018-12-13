/**
 * For the abstraction reform comparison table, maps the data from the view
 * to the data format expected by the GOV UK frontend table component
 * @param  {Object} data - view data for a particular NALD item, e.g. purpose, point
 * @return {Object}      - Nunjucks table component options
 */
const mapARComparisonTable = (data) => {
  const keys = Object.keys(data.base);

  const rows = keys.map(key => ([
    { text: key },
    { text: data.base[key] },
    { text: data.base[key] === data.reform[key] ? null : data.reform[key] }
  ]));

  return {
    head: [
      {
        text: 'NALD field'
      },
      {
        text: 'NALD data'
      },
      {
        text: 'New value'
      }
    ],
    rows
  };
};

module.exports = {
  mapARComparisonTable
};

const { cloneDeep } = require('lodash');
const moment = require('moment');

/**
 * Applies single total to lines by distributing the value among all
 * lines within abstraction period
 * Period start day/month
 * Period end day/month
 */
const applySingleTotal = (data, total) => {
  const d = cloneDeep(data);

  set(d, 'reading.totalFlag', true);
  set(d, 'reading.total', total);

  // const {
  //   periodEndDay,
  //   periodEndMonth,
  //   periodStartDay,
  //   periodStartMonth
  // } = d.metadata.nald;
  //
  // const
  //
  // const isWithinAbstractionPeriod = line => {
  //   const lineStart = moment(line.startDate).format('MMDD');
  //   const lineEnd = moment(line.endDate).format('MMDD');
  //
  //   return startDay >
  // };
  //
  // // Create dates for abs period start / end
  // d.lines = requiredLines.map(line => {
  //   const startDay =
  // });
};

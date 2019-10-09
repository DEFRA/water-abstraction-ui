const forHelper = (from, to, incr, block) => {
  let accum = '';
  for (let i = from; i < to; i += incr) {
    accum += block.fn(i);
  }
  return accum;
};

module.exports = forHelper;

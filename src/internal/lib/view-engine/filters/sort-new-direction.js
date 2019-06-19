const sortNewDirection = (query, field) => {
  const { direction, sort } = query;
  const newDirection = (direction === 1) && (sort === field) ? -1 : 1;
  return newDirection;
};

exports.sortNewDirection = sortNewDirection;

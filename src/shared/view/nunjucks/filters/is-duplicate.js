const isDuplicate = (licenceRef, items) => {
  let duplicates = [];
  const tempArray = [...items].sort((a, b) => a.licenceRef > b.licenceRef);
  for (let i = 0; i < tempArray.length - 1; i++) {
    if (tempArray[i + 1].licenceRef === tempArray[i].licenceRef) {
      duplicates.push(tempArray[i].licenceRef);
    }
  }
  return duplicates.length;
};
exports.isDuplicate = isDuplicate;

const isBillingAccountReference = query => {
  const pattern = /^[ABENSTWY][0-9]{8}A$/
  return pattern.test(query)
}

module.exports = { isBillingAccountReference }

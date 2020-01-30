class Batch {
  /**
   * Creates a new batch object
   *
   * @param {String} batchId The UUID of the batch
   * @param {Date} billRunDate The date the batch was created
   * @param {String} type The type of batch (supplementary, annual)
   */
  constructor (batchId, billRunDate, type) {
    this.region = {};
    this.id = batchId;
    this.billRunDate = billRunDate;
    this.type = type;
  }

  /**
   * Sets the region for the batch
   *
   * @param {String} name The region name
   * @param {String} id The region id
   */
  setRegion (name, id) {
    this.region.name = name;
    this.region.id = id;
    return this;
  }
}

module.exports = Batch;

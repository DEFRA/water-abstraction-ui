'use strict';

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
   * @param {String} id The region id
   * @param {String} name The region name
   * @param {String} displayName The region display name
   */
  setRegion (id, name, displayName) {
    this.region.id = id;
    this.region.name = name;
    this.region.displayName = displayName;
    return this;
  }
}

module.exports = Batch;

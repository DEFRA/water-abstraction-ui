'use strict';

const Region = require('./region');

class Regions {
  /**
   * Creates an object representing an array of Region objects
   * @param {Array<Region>} regions The list of regions
   */
  constructor (regions) {
    this.regions = regions;
  }

  getById (id) {
    return this.regions.find(region => region.id === id);
  }

  static fromRegions (regions) {
    const modelRegions = regions.map(region => {
      return new Region(region.regionId, region.name, region.displayName);
    });

    return new Regions(modelRegions);
  }
}

module.exports = Regions;

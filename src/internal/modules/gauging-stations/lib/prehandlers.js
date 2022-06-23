'use strict'
const services = require('../../../lib/connectors/services')

const loadGaugingStation = async request =>
  services.water.gaugingStations.getGaugingStationbyId(request.params.gaugingStationId)

const loadGaugingStationLicences = async request =>
  services.water.gaugingStations.getGaugingStationLicences(request.params.gaugingStationId)

const loadGaugingStationsByLicenceId = async request =>
  services.water.gaugingStations.getGaugingStationsByLicenceId(request.params.licenceId)

exports.loadGaugingStation = loadGaugingStation
exports.loadGaugingStationLicences = loadGaugingStationLicences
exports.loadGaugingStationsByLicenceId = loadGaugingStationsByLicenceId


# water-abstraction
[![Maintainability](https://api.codeclimate.com/v1/badges/cbb2d0b03cc084ad17a3/maintainability)](https://codeclimate.com/github/DEFRA/water-abstraction-ui/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/cbb2d0b03cc084ad17a3/test_coverage)](https://codeclimate.com/github/DEFRA/water-abstraction-ui/test_coverage)

[![Build Status](https://travis-ci.org/DEFRA/water-abstraction-ui.svg?branch=master)](https://travis-ci.org/DEFRA/water-abstraction-ui)

[![Known Vulnerabilities](https://snyk.io/test/github/DEFRA/water-abstraction-ui/badge.svg)](https://snyk.io/test/github/DEFRA/water-abstraction-ui)

Project for the GOV.UK Water Abstraction service

## Installation

If on Windows you will need to open powershell with administrator privileges and run this command. This is a prerequisite for bcrypt.

```
npm install --global --production windows-build-tools
```

On all platforms run:

```
npm install --only=dev
gulp clean && gulp copy-govuk-files && gulp install-govuk-files && gulp copy-static-assets && gulp sass
```

## Environment Variables

The required environment variables for local development can be found in the [.env.example file](./.env.example).

## Launching

`node index.js`

## Security

A valid JWT token is required for requests to the API. This should be appended to the URL in the format /API/1.0/org?token=[insert token here].

Please note that a mechanism for obtaining the JWT token is not yet in place.

## Contributing to this project

Please read the [contribution guidelines](/CONTRIBUTING.md) before submitting a pull request.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

>Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

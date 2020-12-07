This regression pack is powered by [WebdriverIO](https://webdriver.io/).

### Dependencies
For the pack to run successfully, you will need:
##### Services
- Postgres 13.x onwards
- Node 12.x
- Redis 6.x 

##### Drivers
- msedgedriver
- chrome-driver (`brew install --cask chromedriver`)

##### Components
- water-abstraction-service
- water-abstraction-returns
- water-abstraction-tactical-idm
- water-abstraction-tactical-crm
- water-abstraction-permit-repository




### Usage
The pack can be run from the root of this repository.
```
npm run test:regression
```

### Structure

The pack uses the [Mocha framework](https://mochajs.org/).

The regression pack is split into two areas:
- Internal: The parts of the application intended for use by the authority
- External: The parts of the service that are exposed to licencees.

The tests are broken into `*.spec.js` files. Each spec resembles a User Journey.

Generic helpers that are reused in different user journeys are placed in the helpers folder that corresponds to the sub-pack.

If a helper is needed across both the internal and external subpacks, it can go in the `shared-helpers` folder.
[![npm latest version](https://img.shields.io/npm/v/lab-ui-websocket.svg)](https://www.npmjs.com/package/lab-ui-websocket)
[![Build Status](https://travis-ci.org/MicroControlLab/lab-ui-websocket.svg?branch=master)](https://travis-ci.org/MicroControlLab/lab-ui-websocket)
[![Coverage Status](https://coveralls.io/repos/github/MicroControlLab/lab-ui-websocket/badge.svg?branch=master)](https://coveralls.io/github/MicroControlLab/lab-ui-websocket?branch=master)
[![Apache 2.0 licensed](https://img.shields.io/hexpm/l/plug.svg)](https://raw.githubusercontent.com/MicroControlLab/lab-ui-websocket/master/LICENSE)
[![Greenkeeper badge](https://badges.greenkeeper.io/MicroControlLab/lab-ui-websocket.svg)](https://greenkeeper.io/)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Documentation](https://img.shields.io/badge/docs-gh--pages-brightgreen.svg)](https://microcontrollab.github.io/lab-ui-websocket/index.html)

[![NPM](https://nodei.co/npm/lab-ui-websocket.png)](https://npmjs.org/package/lab-ui-websocket)

# lab-ui-websocket

Reconnecting WebSocket interface for [LabUI](https://github.com/MicroControlLab/lab-ui), with specialliced methods to simplify the generalized usage with the LabUi uiGenerator class.

## Development

### NPM scripts

-   `npm t`: Run test suite
-   `npm start`: Run `npm run build` in watch mode
-   `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
-   `npm run test:prod`: Run linting and generate coverage
-   `npm run build`: Generate bundles and typings, create docs
-   `npm run lint`: Lints code
-   `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)

## Credits

The idea is for the reconnecting WebSocket interface is taken from [Joe Walnes ReconnectingWebSocket](https://github.com/joewalnes/reconnecting-websocket) and the basic typescript implenetation was taken from [David Doran typescript implementation](https://github.com/daviddoran/typescript-reconnecting-websocket).

Thank also goes to @alexjoverm who created [typescript-library-starter](https://github.com/alexjoverm/typescript-library-starter)

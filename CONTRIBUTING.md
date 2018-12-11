We're really glad you're reading this, because we need volunteer developers to help this project come to fruition. 👏

## Instructions

These steps will guide you through contributing to this project:

-   Fork the repo
-   Clone it and install dependencies

        		git clone https://github.com/MicroControlLab/lab-ui-websocket.git
        		npm install

Keep in mind that after running `npm install` the git repo is reset. So a good way to cope with this is to have a copy of the folder to push the changes, and the other to try them.

Make and commit your changes. Make sure the commands npm run build and npm run test:prod are working.

Finally send a [GitHub Pull Request](https://github.com/MicroControlLab/lab-ui-websocket/compare?expand=1) with a clear list of what you've done (read more [about pull requests](https://help.github.com/articles/about-pull-requests/)). Make sure all of your commits are atomic (one feature per commit).

### NPM scripts

-   `npm t`: Run test suite
-   `npm start`: Run `npm run build` in watch mode
-   `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
-   `npm run test:prod`: Run linting and generate coverage
-   `npm run build`: Generate bundles and typings, create docs
-   `npm run lint`: Lints code
-   `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)

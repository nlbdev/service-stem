FROM node:lts-alpine
LABEL MAINTAINER Gaute Rønningen <Gaute.Ronningen@nlb.no> <http://www.nlb.no/>

# Create tmp directory
WORKDIR /tmp/service_stem

# Copy app source
COPY . .

# Install dependencies for production and build
RUN yarn && yarn build

# Create app directory
WORKDIR /usr/src/app

# Copy node modules
RUN cp -a /tmp/service_stem/node_modules /usr/src/app
RUN cp -a /tmp/service_stem/dist/* /usr/src/app
RUN rm -rf /tmp/service_stem

HEALTHCHECK --interval=30s --timeout=10s --start-period=1m CMD http_proxy="" https_proxy="" wget --quiet --tries=1 --spider http://${HOST-0.0.0.0}:${PORT:-443}/health || exit 1
CMD [ "node", "app.js" ]

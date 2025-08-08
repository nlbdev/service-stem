FROM node:20-alpine AS build
LABEL MAINTAINER Gaute Rønningen <Gaute.Ronningen@nlb.no> <http://www.nlb.no/>

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies for production
RUN pnpm install --frozen-lockfile --prod

# Bundle app source
COPY . .

FROM node:20-alpine AS runner
LABEL MAINTAINER Gaute Rønningen <Gaute.Ronningen@nlb.no> <http://www.nlb.no/>

# Install pnpm in runner stage
RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /usr/src/app .

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 80 443

# Health check with improved configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=1m --retries=3 \
  CMD http_proxy="" https_proxy="" curl --fail http://${HOST:-0.0.0.0}:${PORT:-80}/health || exit 1

# Start the application
CMD [ "node", "src/index.js" ]

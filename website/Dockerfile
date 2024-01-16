FROM node:20
WORKDIR /app


COPY package.json ./

RUN npm install --production

COPY dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Env variables for the search engine
# AZURE_AI_API_KEY
# AZURE_AI_ENDPOINT
# AZURE_AI_VERSION
# AZURE_DEPLOYMENT_ID
# POSTGRES_CONNECTION_STRING


CMD ["node", "dist/server/entry.mjs"]
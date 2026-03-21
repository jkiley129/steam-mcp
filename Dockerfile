FROM node:18-alpine

ENV STEAM_API_KEY=""
ENV STEAM_ID=""

RUN npm install -g steam-mcp

CMD ["steam-mcp"]

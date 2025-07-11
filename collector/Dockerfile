FROM node:20-alpine3.20

WORKDIR /app

COPY . .

RUN npm install

RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
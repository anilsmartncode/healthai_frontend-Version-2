FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Fix expo permissions
RUN chmod -R 755 /app/node_modules/.bin

EXPOSE 8081

# CMD ["npx", "expo", "start", "--tunnel"]
#CMD ["npx", "expo", "start", "--host", "0.0.0.0"]
CMD ["npx", "expo", "start", "--host", "lan"]

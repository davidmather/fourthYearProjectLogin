FROM node:10-slim
LABEL maintainer david.mather@mycit.ie

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --production
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

USER node
ENV NODE_ENV=production

#This is what runs automatically when the docker image is run
EXPOSE 16001
CMD [ "npm", "start" ]
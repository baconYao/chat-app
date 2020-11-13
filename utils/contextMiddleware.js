const jwt = require('jsonwebtoken');
const { PubSub } = require('apollo-server');

const { JWT_SECRET } = require('../config/env.json');

const pubsub = new PubSub();

module.exports = context => {
  let token;
  if (context.req && context.req.headers.authorization) {
    token = context.req.headers.authorization.split('Bearer ')[1];
  } else if(context.connection && context.connection.context.Authorization) {
    // For subscription (it uses websocket)
    token = context.connection.context.Authorization.split('Bearer ')[1];
  }
  if(token) {
    jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
      context.user = decodedToken;
    });
  }
  // 將 pubsub 實例透過 context 攜帶給後續的 router 使用。
  context.pubsub = pubsub;
  return context;
}
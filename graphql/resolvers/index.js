const userResolvers = require('./users');
const messageResolvers = require('./messages');

module.exports = {
  Message: {
    createdAt: (parent) => parent.createdAt.toISOString(),   // 將 Message 的 createdAt 日期變成可讀得 string
  },
  Query: {
    ...userResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...messageResolvers.Mutation
  }
}
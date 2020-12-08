const userResolvers = require('./users');
const messageResolvers = require('./messages');

const { User, Message } = require('../../models');

module.exports = {
  Message: {
    createdAt: (parent) => parent.createdAt.toISOString(),   // 將 Message 的 createdAt 日期變成可讀得 string
  },
  Reaction: {
    createdAt: (parent) => parent.createdAt.toISOString(),   // 將 Reaction 的 createdAt 日期變成可讀得 string
    message: async (parent) => await Message.findByPk(parent.messageId),
    // 取得 user 的資訊，但有限制回傳的欄位
    user: async (parent) => await User.findByPk(parent.userId, { attributes: ['username', 'imageUrl', 'createdAt'] }),
  },
  User: {
    createdAt: (parent) => parent.createdAt.toISOString(),   // 將 User 的 createdAt 日期變成可讀得 string
  },
  Query: {
    ...userResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...messageResolvers.Mutation
  },
  Subscription: {
    ...messageResolvers.Subscription,
  }
}
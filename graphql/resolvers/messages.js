const { UserInputError, AuthenticationError, withFilter } = require('apollo-server');
const { Op } = require('sequelize');

const { Message, User } = require('../../models');

module.exports = {
  Query: {
    getMessages: async (parent, { from }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');
        // 取得送訊人資訊
        const otherUser = await User.findOne({
          where: { username: from }
        });
        if (!otherUser) throw new UserInputError('User not found'); 
        // 包含了自己和送訊人的名稱
        const usernames = [user.username, otherUser.username];
        // 因為是通訊軟體，所以自己送出和收到的訊息 (同一個對方) 都要取得
        const messages = await Message.findAll({
          where: {
            from: {[Op.in]: usernames},
            to: {[Op.in]: usernames}
          },
          order: [['createdAt', 'DESC']],
        });
        return messages;
      } catch(err) {
        console.log(err);
        throw err;
      }
    }
  },
  Mutation: {
    sendMessage: async (parent, args, context) => {
      try {
        let { user, pubsub } = context;
        if (!user) throw new AuthenticationError('Unauthenticated');
        let { to, content } = args;
        const recipient = await User.findOne({ where: {username: to} });
        if (!recipient) {
          throw new UserInputError('User not found');
        } else if (recipient.username === user.username) {
          throw new UserInputError('You can\'t message yourself');
        }

        if (content.trim() === '') {
          throw new UserInputError('Message is empty');
        }

        const message = await Message.create({
          from: user.username,
          to,
          content
        });

        // 推送訊息 mewMessage 到標記 NEW_MESSAGE label 的 pubsub
        pubsub.publish('NEW_MESSAGE', { newMessage: message });

        return message;
      } catch(err) {
        console.log(err);
        throw err;
      }
    }
  },
  Subscription: {
    newMessage: {
      /*
        註冊一個pubsub監聽 NEW_MESSAGE 的事件
        透過 withFilter 過濾掉不屬於訊息收送端的雙方
      */
      subscribe: withFilter((_, __, { pubsub, user }) => {
        if(!user) throw new AuthenticationError('Unauthenticated');
        return pubsub.asyncIterator(['NEW_MESSAGE']);
      }, (parent, _, { user }) => {
        let { newMessage } = parent;
        if(newMessage.from === user.username || newMessage.to === user.username) {
          return true;
        }
        return false;
      })
    }
  }
};
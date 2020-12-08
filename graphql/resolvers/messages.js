const { UserInputError, AuthenticationError, ForbiddenError, withFilter } = require('apollo-server');
const { Op } = require('sequelize');

const { Message, User, Reaction } = require('../../models');

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
          include: [{ model: Reaction, as: 'reactions' }]
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
    },
    reactToMessage: async (_, { uuid, content }, { user, pubsub }) => {
      const reactions = ['❤️', '😆', '😯', '😢', '😡', '👍', '👎'];
      try {
        // Validate reaction content
        if(!reactions.includes(content)) {
          throw new UserInputError('Invalid reaction');
        }

        // Get user
        const username = user ? user.username : '';
        user = await User.findOne({ where: {username }});
        if(!user) {
          throw new AuthenticationError('Unauthenticated');
        }

        // Get message
        const message = await Message.findOne({ where: {uuid}});
        if(!message) throw new UserInputError('message not found');

        if(message.from !== user.username && message.to !== user.username) {
          throw new ForbiddenError('Unauthorized');
        }

        let reaction = await Reaction.findOne({
          where: { messageId: message.id, userId: user.id }
        });

        if(reaction) {
          // Reaction exists, update it
          reaction.content = content;
          await reaction.save();
        } else {
          // Reaction doesn't exists, create it
          reaction = await Reaction.create({
            messageId: message.id,
            userId: user.id,
            content
          });
        }

        // 推送訊息 mewMessage 到標記 NEW_MESSAGE label 的 pubsub
        pubsub.publish('NEW_REACTION', { newReaction: reaction });

        return reaction;
      } catch(err) {
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
        return pubsub.asyncIterator('NEW_MESSAGE');
      }, (parent, _, { user }) => {
        let { newMessage } = parent;
        if(newMessage.from === user.username || newMessage.to === user.username) {
          return true;
        }
        return false;
      })
    },
    newReaction: {
      /*
        註冊一個pubsub監聽 NEW_REACTION 的事件
        透過 withFilter 過濾掉不屬於訊息收送端的雙方
      */
      subscribe: withFilter((_, __, { pubsub, user }) => {
        if(!user) throw new AuthenticationError('Unauthenticated');
        return pubsub.asyncIterator('NEW_REACTION');
      }, async ({newReaction}, _, { user }) => {
        // destruction from apollo hook
        // 因為 message 是另一個 type，因此從 reaction 取得時，必須等待 reaction 去 qeury message 的資料。
        const message = await newReaction.getMessage();
        if(message.from === user.username || message.to === user.username) {
          return true;
        }
        return false;
      })
    }
  }
};
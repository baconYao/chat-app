const bcrypt = require('bcryptjs');
const { UserInputError, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { Message, User } = require('../../models');
const { JWT_SECRET } = require('../../config/env.json');

module.exports = {
  Query: {
    getUsers: async (_, __, context) => {
      try {
        let { user } = context;
        if (!user) throw new AuthenticationError('Unauthenticated');

        // 在聊天室中，要取得所有的 user，但不包含自己
        let users = await User.findAll({
          attributes: ['username', 'imageUrl', 'createdAt'],  // 告訴 DB 要撈的欄位
          where: { username: { [Op.ne]: user.username } }
        });

        // 取得此位 user 的所有 messages，無論是 from / to
        const allUserMessages = await Message.findAll({
          where: {
            [Op.or]: [{ from: user.username }, { to: user.username }]
          },
          order: [['createdAt', 'DESC']],
        });

        // 將此位 user 的最後訊息給撈出來，並將之對應到另一位對談的 user B (為了做聊天室側邊欄位的最後顯示訊息使用)
        users = users.map((otherUser) => {
          const latestMessage = allUserMessages.find((message) => {
            return message.from === otherUser.username || message.to === otherUser.username
          });
          otherUser.latestMessage = latestMessage;
          return otherUser;
        });

        return users;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    login: async (_, args) => {
      const { username, password } = args;
      let errors = {};
      try {
        if (username.trim() === '') errors.username = 'username must not be empty';
        // password can be "   ", white space
        if (password === '') errors.password = 'password must not be empty';

        if (Object.keys(errors).length > 0) {
          throw new UserInputError('bad input', {errors})
        }

        const user = await User.findOne({
          where: { username }
        });

        if (!user) {
          errors.username = 'user not found';
          throw new UserInputError('user not found', { errors });
        }

        const correctPassword = await bcrypt.compare(password, user.password);

        if (!correctPassword) {
          errors.password = 'password is incorrect';
          throw new UserInputError('password is incorrect', {errors});
        }

        const token = jwt.sign({username}, JWT_SECRET, { expiresIn: 60 * 60 });

        return {
          ...user.toJSON(),
          token
        }
      } catch(err) {
        console.log(err);
        throw err;
      }
    }
  },
  Mutation: {
    register: async (_, args) => {
      let { username, email, password, confirmPassword } = args;
      let errors = {};

      try {
        // Validate input data
        if(email.trim() === '') errors.email = 'email must not be empty';
        if(username.trim() === '') errors.username = 'username must not be empty';
        if(password.trim() === '') errors.password = 'password must not be empty';
        if(confirmPassword.trim() === '') errors.confirmPassword = 'repeat password must not be empty';

        if(password !== confirmPassword) errors.confirmPassword = 'passwords must match';

        if (Object.keys(errors).length > 0) throw errors; 

        // Hashpassword
        password = await bcrypt.hash(password, 6);

        // Create yser
        const user = await User.create({
          username, email, password
        });
        return user;
      } catch (err) {
        console.log(err);
        if(err.name === 'SequelizeUniqueConstraintError') {
          err.errors.forEach(e => (errors[e.path.split('.')[1]] = `${e.path.split('.')[1]} is already taken`));
        } else if(err.name === 'SequelizeValidationError') {
          err.errors.forEach(e => (errors[e.path] = e.message));
        }
        throw new UserInputError('Bad input', { errors });
      }
    },
  }
};
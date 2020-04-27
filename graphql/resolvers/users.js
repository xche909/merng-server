const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");
const User = require("../../models/User");
const { SECRET_KEY } = require("../../config");
const {
  validateRegisterInputs,
  validateLoginInputs
} = require("../../util/validators");

const generateToken = user => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
};

module.exports = {
  Mutation: {
    register: async (
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) => {
      // validate user inputs
      const { errors, valid } = validateRegisterInputs(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Input error!", { errors });
      }
      // check if user already exists
      const user = await User.findOne({ username });
      if (user) {
        errors.general = "Username is taken!";
        throw new UserInputError("Username is taken!", { errors });
      }
      // hash password, save new user and generate token
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString()
      });

      const res = await newUser.save();
      const token = generateToken(res);
      // return graphql type User
      return {
        ...res._doc,
        id: res._id,
        token
      };
    },
    login: async (_, { username, password }) => {
      // validate user inputs
      const { errors, valid } = validateLoginInputs(username, password);
      if (!valid) {
        throw new UserInputError("Input error!", { errors });
      }
      // check if there is such user
      const user = await User.findOne({ username });

      if (!user) {
        errors.general = "User not found!";
        throw new UserInputError("User not found!", { errors });
      }

      //check password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.general = "Wrong credentials!";
        throw new UserInputError("Wrong credentials!", { errors });
      }

      // generate token
      const token = generateToken(user);
      // return graphql type User
      return {
        ...user._doc,
        id: user._id,
        token
      };
    }
  }
};

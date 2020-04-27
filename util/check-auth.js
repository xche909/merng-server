const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { AuthenticationError } = require("apollo-server");

module.exports = context => {
  // Grab authorization header
  const authHeader = context.req.headers.authorization;
  if (authHeader) {
    // Grab token from header
    const token = authHeader.split("Bearer ")[1];
    if (token) {
      try {
        // Grab user from token
        const user = jwt.verify(token, SECRET_KEY);
        return user;
      } catch (err) {
        throw new AuthenticationError("Invaliv/Expired token");
      }
    }
    throw Error('Authentication token must be "Bearer [token]"');
  }
  throw new Error("Authorization header must be provided");
};

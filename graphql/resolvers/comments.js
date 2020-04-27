const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");
const { UserInputError, AuthenticationError } = require("apollo-server");

module.exports = {
  Mutation: {
    createComment: async (_, { postId, body }, context) => {
      // Check there is a user logged in
      const { username } = checkAuth(context);

      // Check body is not empty
      if (body.trim() === "") {
        throw new UserInputError("Comment body must not be empty!", {
          errors: {
            body: "Comment body must not be empty!"
          }
        });
      }

      // Check if post exists
      const post = await Post.findById(postId);
      if (post) {
        // Add Comment
        const comment = { body, username, createdAt: new Date().toISOString() };
        post.comments.unshift(comment);
        await post.save();
        return post;
      } else {
        throw new UserInputError("Post does not exist!");
      }
    },

    deleteComment: async (_, { postId, commentId }, context) => {
      // Check user logged in
      const { username } = checkAuth(context);

      // Check post exists
      const post = await Post.findById(postId);
      if (post) {
        const commentIndex = post.comments.findIndex(c => c.id === commentId);
        // Check comment exists
        if (commentIndex === -1) {
          throw new UserInputError("Comment does not exist!");
        } else {
          // Check the creator of the commenr is the deleter
          if (post.comments[commentIndex].username === username) {
            post.comments.splice(commentIndex, 1);
            await post.save();
            return post;
          } else {
            throw new AuthenticationError("Not authorized for the action!");
          }
        }
      } else {
        throw new UserInputError("Post does not exist!");
      }
    }
  }
};

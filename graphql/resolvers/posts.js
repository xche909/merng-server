const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = {
  Query: {
    getPosts: async () => {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        return new Error(err);
      }
    },

    getPost: async (_, { postId }) => {
      try {
        const post = await Post.findById(postId);
        if (post) {
          return post;
        } else {
          throw new Error("Post does not exist!");
        }
      } catch (err) {
        throw new Error(err);
      }
    }
  },

  Mutation: {
    createPost: async (_, { body }, context) => {
      // Check there is a user loggin
      const user = checkAuth(context);

      // No need to handle errors after this bcz errors already handled in checkAuth method, which means it the code proceeds till here, there must be a user loggin in

      // Make sure post body is not empty
      if (body.trim() === "") {
        throw new UserInputError("Post body must now be empty", {
          errors: {
            body: "Post body must not be empty"
          }
        });
      }

      // Create the post
      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString()
      });

      const post = await newPost.save();

      context.pubsub.publish("NEW_POST", {
        newPost: post
      });

      return post;
    },

    deletePost: async (_, { postId }, context) => {
      // Check there is a user loggin
      const user = checkAuth(context);
      // Grab the post
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error("Post does not exist!");
      }
      // Check if the loggin user is the creator of the post
      if (user.username !== post.username) {
        throw new AuthenticationError("Not authorized for the action!");
      }

      // delete post
      await post.delete();
      return "Post deleted successfully!";
    },

    // async deletePost(_, { postId }, context) {
    //   const user = checkAuth(context);

    //   try {
    //     const post = await Post.findById(postId);
    //     if (user.username === post.username) {
    //       await post.delete();
    //       return "Post deleted successfully";
    //     } else {
    //       throw new AuthenticationError("Action not allowed");
    //     }
    //   } catch (err) {
    //     throw new Error(err);
    //   }
    // }

    likePost: async (_, { postId }, context) => {
      // Check user logged in
      const { username } = checkAuth(context);

      // Check post exists
      const post = await Post.findById(postId);
      if (post) {
        // Check if post is already liked by the logged in user
        // if post already liked by the user then unlike it
        if (post.likes.find(l => l.username === username)) {
          post.likes = post.likes.filter(l => l.username !== username);
        }
        // if post not liked yet by the user then like it
        else {
          const like = {
            username,
            createdAt: new Date().toISOString()
          };
          post.likes = post.likes.concat([like]);
        }
        await post.save();
        return post;
      } else throw new UserInputError("Post does not exist!");
    }
  },

  Subscription: {
    newPost: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("NEW_POST")
    }
  }
};

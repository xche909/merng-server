const postResolvers = require("./posts");
const userResolvers = require("./users");
const commentResolvers = require("./comments");

module.exports = {
  //  below post is a modifier, each time a query, mutation or subscription returns a post type,
  // we will go through this modifier
  Post: {
    likeCount: parent => {
      //console.log(parent);
      return parent.likes.length;
    },
    commentCount: parent => parent.comments.length
  },
  Query: {
    ...postResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...commentResolvers.Mutation
  },
  Subscription: {
    ...postResolvers.Subscription
  }
};

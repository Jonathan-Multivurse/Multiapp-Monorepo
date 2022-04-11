import { gql } from "apollo-server";
import {
  PartialSchema,
  ApolloServerContext,
  NoArgs,
  secureEndpoint,
} from "backend/lib/apollo-helper";

import { isUser } from "backend/schemas/user";
import type { Post, PostCategory } from "backend/schemas/post";
import type { Fund } from "backend/schemas/fund";

const schema = gql`
  type Query {
    verifyInvite(code: String!): Boolean!
    posts(categories: [PostCategory!]): [Post!]
    funds: [Fund!]
  }
`;

const resolvers = {
  Query: {
    verifyInvite: async (
      parentIgnored: unknown,
      { code }: { code: string },
      { db }: ApolloServerContext
    ): Promise<boolean> => db.users.verifyInvite(code),

    posts: secureEndpoint(
      async (
        parentIgnored,
        { categories }: { categories?: PostCategory[] },
        { db, user }
      ): Promise<Post.Mongo[]> => {
        const userData = await db.users.find({ _id: user._id });
        if (!userData || !isUser(userData)) return [];

        return db.posts.findByCategory(
          user.acc === "none" ? "everyone" : user.acc,
          categories,
          userData.hiddenPostIds,
          userData.hiddenUserIds
        );
      }
    ),

    funds: secureEndpoint(
      async (
        parentIgnored,
        argsIgnored,
        { db, user }
      ): Promise<Fund.Mongo[]> => {
        const userData = await db.users.find({ _id: user._id });
        if (!userData || !isUser(userData)) return [];

        return db.funds.findByAccreditation(user.acc);
      }
    ),
  },
};

const partialSchema: PartialSchema = { schema, resolvers };
export default partialSchema;

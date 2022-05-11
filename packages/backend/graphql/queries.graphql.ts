import { gql } from "apollo-server";
import * as yup from "yup";
import _ from "lodash";
import { getChatToken } from "../lib/tokens";
import {
  PartialSchema,
  ApolloServerContext,
  secureEndpoint,
} from "../lib/apollo-helper";
import {
  isObjectId,
  NotFoundError,
  UnprocessableEntityError,
  validateArgs,
} from "../lib/validate";

import { User, isUser, compareAccreditation } from "../schemas/user";
import type { Company } from "../schemas/company";
import {
  Post,
  PostCategory,
  PostCategoryOptions,
  PostRoleFilter,
  PostRoleFilterOptions,
} from "../schemas/post";
import type { Fund } from "../schemas/fund";
import type { Notification } from "../schemas/notification";

const schema = gql`
  type Query {
    verifyInvite(code: String!): Boolean!
    account: User
    chatToken: String
    post(postId: ID!): Post
    posts(categories: [PostCategory!], roleFilter: PostRoleFilter): [Post!]
    funds: [Fund!]
    fund(fundId: ID!): Fund
    fundManagers(featured: Boolean): FundManagers
    fundCompanies: [Company!]
    professionals(featured: Boolean): [UserProfile!]
    userProfile(userId: ID!): UserProfile
    companyProfile(companyId: ID!): Company
    notifications: [Notification!]
    mentionUsers(search: String): [UserProfile!]
    globalSearch(search: String): GlobalSearchResult
    users: [UserProfile!]!
  }

  type FundManagers {
    managers: [User!]!
    funds: [Fund!]!
  }

  type GlobalSearchResult {
    users: [User!]!
    companies: [Company!]!
    posts: [Post!]!
    funds: [Fund!]!
  }
`;

export type FundManagers = {
  managers: User.Mongo[];
  funds: Fund.Mongo[];
};

export type GlobalSearchResult = {
  users: User.Mongo[];
  companies: Company.Mongo[];
  posts: Post.Mongo[];
  funds: Fund.Mongo[];
};

const resolvers = {
  Query: {
    verifyInvite: async (
      parentIgnored: unknown,
      args: { code: string },
      { db }: ApolloServerContext
    ): Promise<boolean> => {
      const validator = yup
        .object()
        .shape({
          code: yup.string().required(),
        })
        .required();

      validateArgs(validator, args);

      const { code } = args;
      return db.users.verifyInvite(code);
    },

    /**
     * Fetch account details for the currently authenticated user.
     *
     * @returns   The User object associated with the current user.
     */
    post: secureEndpoint(
      async (
        parentIgnored,
        args: { postId: string },
        { db }
      ): Promise<Post.Mongo | null> => {
        const validator = yup
          .object()
          .shape({
            postId: yup.string().required().test({
              test: isObjectId,
              message: "Invalid post id",
            }),
          })
          .required();

        validateArgs(validator, args);

        const { postId } = args;

        const postData = await db.posts.find(postId);
        if (!postData) {
          throw new NotFoundError("Post");
        }

        return postData;
      }
    ),

    posts: secureEndpoint(
      async (
        parentIgnored,
        args: { categories?: PostCategory[]; roleFilter?: PostRoleFilter },
        { db, user }
      ): Promise<Post.Mongo[]> => {
        const validator = yup
          .object()
          .shape({
            categories: yup.array().of(
              yup
                .string()
                .oneOf(_.map(Object.values(PostCategoryOptions), "value"))
                .required()
            ),
            roleFilter: yup
              .string()
              .oneOf(_.map(Object.values(PostRoleFilterOptions), "value")),
          })
          .required();

        validateArgs(validator, args);

        const { categories, roleFilter = "everyone" } = args;

        const userData = await db.users.find({ _id: user._id });
        if (!userData || !isUser(userData)) {
          throw new NotFoundError();
        }

        return db.posts.findByFilters(
          userData.accreditation === "none"
            ? "everyone"
            : userData.accreditation,
          categories,
          userData.hiddenPostIds,
          userData.hiddenUserIds,
          roleFilter,
          userData.followingIds
        );
      }
    ),

    /**
     * Fetch account details for the currently authenticated user.
     *
     * @returns   The User object associated with the current user.
     */
    account: secureEndpoint(
      async (
        parentIgnored,
        argsIgnored,
        { user }
      ): Promise<User.Mongo | null> => user
    ),

    chatToken: secureEndpoint(
      async (parentIgnored, argsIgnored, { user }): Promise<string> =>
        getChatToken(user._id.toString())
    ),

    funds: secureEndpoint(
      async (
        parentIgnored,
        argsIgnored,
        { db, user }
      ): Promise<Fund.Mongo[]> => {
        return db.funds.findByAccreditation(user.accreditation);
      }
    ),

    fund: secureEndpoint(
      async (
        parentIgnored,
        args: { fundId: string },
        { db, user }
      ): Promise<Fund.Mongo | null> => {
        const validator = yup
          .object()
          .shape({
            fundId: yup.string().required().test({
              test: isObjectId,
              message: "Invalid fund id",
            }),
          })
          .required();

        validateArgs(validator, args);

        const { fundId } = args;

        const fund = await db.funds.find(fundId);
        if (!fund) {
          throw new NotFoundError("Fund");
        }
        if (compareAccreditation(user.accreditation, fund.level) < 0) {
          throw new UnprocessableEntityError("Not able to get a fund.");
        }

        return fund;
      }
    ),

    fundManagers: secureEndpoint(
      async (
        parentIgnored,
        args: { featured?: boolean },
        { db, user }
      ): Promise<FundManagers> => {
        const validator = yup
          .object()
          .shape({
            featured: yup.bool(),
          })
          .required();

        validateArgs(validator, args);

        const { featured = false } = args;

        const managers = await db.users.fundManagers(featured);
        const fundIds = Array.from(
          new Set(managers.map((manager) => manager.managedFundsIds).flat())
        );

        const accessibleFunds = (await db.funds.findAll(fundIds)).filter(
          (fund) => compareAccreditation(user.accreditation, fund.level) >= 0
        );
        const accessibleFundIds = accessibleFunds.map((fund) =>
          fund._id.toString()
        );
        const filteredManagers = managers.map((manager) => ({
          ...manager,
          managedFundsIds: manager.managedFundsIds.filter((id) =>
            accessibleFundIds.includes(id.toString())
          ),
        }));

        return {
          funds: accessibleFunds,
          managers: filteredManagers,
        };
      }
    ),

    fundCompanies: secureEndpoint(
      async (parentIgnored, argsIgnored, { db }): Promise<Company.Mongo[]> =>
        db.companies.fundCompanies()
    ),

    professionals: secureEndpoint(
      async (
        parentIgnored,
        args: { featured?: boolean },
        { db }
      ): Promise<User.Mongo[]> => {
        const validator = yup
          .object()
          .shape({
            featured: yup.bool(),
          })
          .required();

        validateArgs(validator, args);

        const { featured = false } = args;

        return db.users.professionals(featured);
      }
    ),

    userProfile: secureEndpoint(
      async (
        parentIgnored,
        args: { userId: string },
        { db }
      ): Promise<User.Mongo | User.Stub> => {
        const validator = yup
          .object()
          .shape({
            userId: yup.string().required().test({
              test: isObjectId,
              message: "Invalid user id",
            }),
          })
          .required();

        validateArgs(validator, args);

        const { userId } = args;

        const userData = await db.users.find({ _id: userId });

        if (!userData) {
          throw new NotFoundError();
        }

        return userData;
      }
    ),

    companyProfile: secureEndpoint(
      async (
        parentIgnored,
        args: { companyId: string },
        { db }
      ): Promise<Company.Mongo> => {
        const validator = yup
          .object()
          .shape({
            companyId: yup.string().required().test({
              test: isObjectId,
              message: "Invalid company id",
            }),
          })
          .required();

        validateArgs(validator, args);

        const { companyId } = args;

        const companyData = await db.companies.find(companyId);
        if (!companyData) {
          throw new NotFoundError("Company");
        }

        return companyData;
      }
    ),

    notifications: secureEndpoint(
      async (
        parentIgnored,
        argsIgnored,
        { db, user }
      ): Promise<Notification.Mongo[]> =>
        db.notifications.findAllByUser(user._id)
    ),

    mentionUsers: secureEndpoint(
      async (
        parentIgnored,
        args: { search?: string },
        { db }
      ): Promise<User.Mongo[]> => {
        const validator = yup
          .object()
          .shape({
            search: yup.string(),
          })
          .required();

        validateArgs(validator, args);

        const { search } = args;

        return db.users.findByKeyword(search);
      }
    ),

    globalSearch: secureEndpoint(
      async (
        parentIgnored,
        args: { search?: string },
        { db }
      ): Promise<GlobalSearchResult> => {
        const validator = yup
          .object()
          .shape({
            search: yup.string(),
          })
          .required();

        validateArgs(validator, args);

        const { search } = args;

        const [users, companies, posts, funds] = await Promise.all([
          db.users.findByKeyword(search),
          db.companies.findByKeyword(search),
          db.posts.findByKeyword(search),
          db.funds.findByKeyword(search),
        ]);

        return { users, companies, posts, funds };
      }
    ),

    users: secureEndpoint(
      async (parentIgnored, argsIgnored, { db }): Promise<User.Mongo[]> =>
        db.users.findAll()
    ),
  },
};

const partialSchema: PartialSchema = { schema, resolvers };
export default partialSchema;

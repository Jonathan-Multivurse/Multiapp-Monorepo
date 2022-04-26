import { gql, useQuery, QueryHookOptions, QueryResult } from '@apollo/client';
import { PostCategory } from 'backend/graphql/posts.graphql';
import { User } from 'backend/graphql/users.graphql';
import {
  POST_SUMMARY_FRAGMENT,
  PostSummary,
} from 'mobile/src/graphql/fragments/post';

type FetchPostsVariables = {
  categories?: PostCategory[];
};

type Post = PostSummary;
export type FetchPostsData = {
  posts?: Post[];
};

/**
 * GraphQL query that fetches posts for the current users home feed.
 *
 * @returns   GraphQL query.
 */
export function useFetchPosts(): QueryResult<
  FetchPostsData,
  FetchPostsVariables
> {
  return useQuery<FetchPostsData, FetchPostsVariables>(
    gql`
      ${POST_SUMMARY_FRAGMENT}
      query Posts($categories: [PostCategory!]) {
        posts(categories: $categories) {
          ...PostSummaryFields
        }
      }
    `,
    { fetchPolicy: 'cache-and-network' },
  );
}

type AccountVariables = never;
export type WatchlistFund = Pick<
  User['watchlist'][number],
  '_id' | 'name' | 'companyId' | 'managerId'
> & {
  company: Pick<
    User['watchlist'][number]['company'],
    '_id' | 'name' | 'website' | 'linkedIn' | 'twitter' | 'avatar'
  >;
};
export type AccountData = {
  account: Pick<
    User,
    | '_id'
    | 'firstName'
    | 'lastName'
    | 'avatar'
    | 'role'
    | 'accreditation'
    | 'position'
    | 'tagline'
    | 'overview'
    | 'background'
    | 'followerIds'
    | 'followers'
    | 'followingIds'
    | 'following'
    | 'watchlistIds'
    | 'companyFollowingIds'
    | 'postIds'
    | 'linkedIn'
    | 'twitter'
    | 'website'
    | 'posts'
    | 'managedFunds'
  > & {
    watchlist: WatchlistFund[];
    company: Pick<
      User['companies'][number],
      | '_id'
      | 'name'
      | 'avatar'
      | 'members'
      | 'background'
      | 'followerIds'
      | 'postIds'
      | 'followingIds'
    >;
    companies: Pick<
      User['companies'][number],
      | '_id'
      | 'name'
      | 'avatar'
      | 'members'
      | 'background'
      | 'followerIds'
      | 'postIds'
      | 'followingIds'
    >[];
  };
};

/**
 * GraphQL query that fetches the account details for the current user
 *
 * @returns   GraphQL query.
 */
export function useAccount(
  options?: QueryHookOptions<AccountData, AccountVariables>,
): QueryResult<AccountData, AccountVariables> {
  return useQuery<AccountData, AccountVariables>(
    gql`
      query Account {
        account {
          _id
          firstName
          lastName
          avatar
          role
          accreditation
          position
          tagline
          overview
          postIds
          website
          linkedIn
          twitter
          tagline
          overview
          followerIds
          followingIds
          following {
            _id
            firstName
            lastName
            avatar
            position
            company {
              _id
              name
            }
          }
          followers {
            _id
            firstName
            lastName
            avatar
            position
            company {
              _id
              name
              website
              linkedIn
              twitter
            }
          }
          companyFollowingIds
          background {
            url
            x
            y
            width
            height
            scale
          }
          watchlist {
            _id
            name
            companyId
            managerId
            company {
              _id
              name
              website
              linkedIn
              twitter
              avatar
            }
          }
          watchlistIds
          companies {
            _id
            name
            avatar
            members {
              _id
              firstName
              lastName
              avatar
              company {
                _id
                name
                website
                linkedIn
                twitter
              }
            }
            following {
              _id
              firstName
              lastName
              avatar
              position
            }
            followers {
              _id
              firstName
              lastName
              avatar
              position
            }
            followerIds
            postIds
            followingIds
            background {
              url
              x
              y
              width
              height
              scale
            }
          }
        }
      }
    `,
    { ...options },
  );
}

type ChatTokenVariables = never;
export type ChatTokenData = {
  chatToken?: string;
};

/**
 * GraphQL query that fetchs an access token for messaging.
 *
 * @returns   GraphQL query.
 */
export function useChatToken(): QueryResult<ChatTokenData, ChatTokenVariables> {
  return useQuery<ChatTokenData, ChatTokenVariables>(
    gql`
      query ChatToken {
        chatToken
      }
    `,
  );
}

export type Invitee = Pick<User, 'avatar' | 'email' | 'firstName' | 'lastName'>;
type InvitesVariables = never;
export type InvitesData = {
  account: Pick<User, '_id'> & {
    invitees: Invitee[];
  };
};

/**
 * GraphQL query that fetches invitations sent by this user.
 *
 * @returns   GraphQL query.
 */
export function useInvites(
  options?: QueryHookOptions<InvitesData, InvitesVariables>,
): QueryResult<InvitesData, InvitesVariables> {
  return useQuery<InvitesData, InvitesVariables>(
    gql`
      query Invites {
        account {
          _id
          invitees {
            __typename
            ... on User {
              avatar
              email
              firstName
              lastName
            }
            ... on UserStub {
              email
            }
          }
        }
      }
    `,
    { ...options },
  );
}

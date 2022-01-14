import { gql } from "apollo-boost";

export const ARTISTS_QUERY = gql`
  query artists($address: Bytes!) {
    artists(where: { address: $address }) {
      id
      inkCount
      address
      earnings
      lastLikeAt
      lastSaleAt
      lastInkAt
      likeCount
      saleCount
      inks(
        first: 999
        orderBy: createdAt
        orderDirection: desc
        where: { burned: false }
      ) {
        id
        jsonUrl
        limit
        count
        bestPrice
        createdAt
        sales {
          id
          price
        }
      }
      tokenTransfers(first: 1, orderBy: createdAt, orderDirection: desc) {
        id
        createdAt
      }
    }
  }
`;

export const TOP_ARTISTS_QUERY = gql`
  query artists(
    $first: Int
    $skip: Int
    $orderBy: String
    $orderDirection: String
    $createdAt: Int
    $filters: Artist_filter
  ) {
    artists(
      first: $first
      skip: $skip
      where: $filters
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      inkCount
      earnings
      address
      likeCount
      likes(where: { createdAt_gt: $createdAt }) {
        createdAt
      }
      inks(where: { createdAt_gt: $createdAt }) {
        createdAt
      }
      sales(where: { createdAt_gt: $createdAt }) {
        createdAt
        price
      }
    }
  }
`;

export const LAST_30_DAILY_TOTALS = gql`
  query dailyTotals($date: Int) {
    dailyTotals(where: { day_gt: $date }) {
      artists
      day
      inks
      id
      saleValue
      sales
      tokens
      upgrades
      users
    }
  }
`;

export const TOTALS_UP_TO_DATE = gql`
  query totals($date: Int) {
    totals(where: { day: $date }) {
      artists
      day
      inks
      id
      saleValue
      sales
      tokens
      upgrades
      users
    }
  }
`;

export const TOTALS = gql`
  query totals {
    totals(first: 1, orderBy: day, orderDirection: desc) {
      artists
      day
      inks
      id
      saleValue
      sales
      tokens
      upgrades
      users
    }
  }
`;

export const TOP_COLLECTORS_QUERY = gql`
  query users(
    $first: Int
    $orderBy: String
    $orderDirection: String
    $createdAt: Int
    $filters: User_filter
  ) {
    users(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $filters
    ) {
      tokenCount
      saleCount
      purchaseCount
      collectionCount
      address
      tokens(first: 999, where: { lastTransferAt_gt: $createdAt }) {
        lastTransferAt
      }
      sales(first: 999, where: { createdAt_gt: $createdAt }) {
        createdAt
      }
      purchases(first: 999, where: { createdAt_gt: $createdAt }) {
        createdAt
      }
      collectedTokens(first: 999, where: { lastTransferAt_gt: $createdAt }) {
        createdAt
      }
    }
  }
`;

export const INKS_QUERY = gql`
  query inks($first: Int, $skip: Int) {
    inks(
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
      where: { burned: false }
    ) {
      id
      inkNumber
      createdAt
      jsonUrl
      artist {
        id
        address
      }
    }
  }
`;

export const EXPLORE_QUERY = gql`
  query inks(
    $first: Int
    $skip: Int
    $orderBy: String
    $orderDirection: String
    $filters: Ink_filter
    $liker: String
  ) {
    inks(
      first: $first
      skip: $skip
      where: $filters
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      inkNumber
      createdAt
      jsonUrl
      bestPrice
      bestPriceSource
      bestPriceSetAt
      count
      limit
      likeCount
      likes(where: { liker: $liker }) {
        id
      }
      artist {
        id
        address
      }
    }
  }
`;

export const INK_LIKES_QUERY = gql`
  query likes($inks: [BigInt], $liker: String) {
    inks(first: 1000, where: { inkNumber_in: $inks }) {
      id
      inkNumber
      likeCount
      likes(where: { liker: $liker }) {
        id
      }
    }
  }
`;

export const HOLDINGS_QUERY = gql`
  query tokens($first: Int, $skip: Int, $owner: Bytes!) {
    metaData(id: "blockNumber") {
      id
      value
    }
    user(id: $owner) {
      tokenCount
    }
    tokens(
      first: $first
      skip: $skip
      where: { owner: $owner }
      orderBy: createdAt
      orderDirection: desc
    ) {
      owner {
        id
      }
      id
      price
      ink {
        id
        jsonUrl
        limit
        count
        artist {
          id
          address
        }
      }
    }
  }
`;

export const INK_QUERY = gql`
  query ink($inkUrl: String!, $liker: String) {
    metaData(id: "blockNumber") {
      id
      value
    }
    ink(id: $inkUrl) {
      id
      burned
      inkNumber
      jsonUrl
      artist {
        id
      }
      limit
      count
      createdAt
      mintPrice
      mintPriceNonce
      likeCount
      likes(where: { liker: $liker }) {
        id
      }
      tokens(first: 999, orderBy: createdAt, orderDirection: asc) {
        id
        owner {
          id
        }
        network
        price
      }
      tokenTransfers(orderBy: createdAt, orderDirection: desc) {
        id
        createdAt
        token {
          id
          edition
        }
        from {
          id
        }
        to {
          id
        }
        sale {
          id
          price
        }
        transactionHash
      }
    }
  }
`;

export const INK_MAIN_QUERY = gql`
  query token($inkUrl: String!) {
    tokens(first: 999, where: { ink: $inkUrl }) {
      id
      owner
      ink
    }
  }
`;

export const HOLDINGS_MAIN_QUERY = gql`
  query tokens($owner: Bytes!) {
    tokens(
      first: 999
      where: { owner: $owner }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      owner
      network
      createdAt
      ink
      jsonUrl
    }
  }
`;

export const HOLDINGS_MAIN_INKS_QUERY = gql`
  query inks($inkList: [String!]) {
    inks(first: 999, where: { id_in: $inkList }) {
      id
      jsonUrl
      limit
      count
      artist {
        id
        address
      }
    }
  }
`;

export const ARTIST_RECENT_ACTIVITY_QUERY = gql`
  query artists(
    $createdAt: Int
    $address: String
    $skipLikes: Int
    $skipSales: Int
    $skipTransfers: Int
  ) {
    artists(where: { address: $address }) {
      id
      lastLikeAt
      lastSaleAt
      lastInkAt
      createdAt
      sales(
        skip: $skipSales
        orderBy: createdAt
        orderDirection: desc
        where: { createdAt_gt: $createdAt }
      ) {
        ink {
          id
          jsonUrl
        }
        createdAt
        id
        buyer {
          id
        }
        seller {
          id
        }
        price
        transactionHash
      }
      likes(
        skip: $skipLikes
        orderBy: createdAt
        orderDirection: desc
        where: { createdAt_gt: $createdAt }
      ) {
        id
        ink {
          id
          jsonUrl
        }
        createdAt
        liker {
          id
        }
      }
      tokenTransfers(
        skip: $skipTransfers
        orderBy: createdAt
        orderDirection: desc
        where: { createdAt_gt: $createdAt, sale: null }
      ) {
        ink {
          id
          jsonUrl
          tokens(orderBy: createdAt, orderDirection: asc, first: 1) {
            id
          }
        }
        to {
          id
          address
        }
        from {
          id
          address
        }
        createdAt
        transactionHash
        id
        token {
          id
        }
      }
    }
  }
`;

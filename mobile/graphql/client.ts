import 'react-native-url-polyfill/auto';

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const uri =
  process.env.EXPO_PUBLIC_GRAPHQL_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:4000/graphql';

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});

import 'react-native-url-polyfill/auto';

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getAuthToken } from '@/services/authSession';

function resolveGraphqlUri() {
  const configured = process.env.EXPO_PUBLIC_GRAPHQL_URL?.trim();
  if (!configured) return 'http://127.0.0.1:4000/graphql';

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    return configured.replace(/\/$/, '');
  }

  const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (!isLocalHost) return configured.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;
  const devHost = hostUri?.split(':')[0];

  if (Platform.OS === 'android' && !devHost) {
    parsed.hostname = '10.0.2.2';
    return parsed.toString().replace(/\/$/, '');
  }

  if (devHost) {
    parsed.hostname = devHost;
    return parsed.toString().replace(/\/$/, '');
  }

  return configured.replace(/\/$/, '');
}

const uri = resolveGraphqlUri();

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();
  if (!token) return { headers };
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(new HttpLink({ uri })),
  cache: new InMemoryCache({
    typePolicies: {
      // Rank rows are job-specific; same resume id must not share one normalized entity across jobs.
      SavedRankedResume: {
        keyFields: false,
      },
      SavedJob: {
        fields: {
          rankedResumes: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import { resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
	mongoose
		.connect(mongoUri)
		.then(() => {
			console.log('[database]: connected successfully');
		})
		.catch(() => {
			console.warn('[database]: connection failed');
		});
} else {
	console.warn('[database]: MONGODB_URI is missing');
}

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use(
	'/graphql',
	cors<cors.CorsRequest>(),
	express.json({ limit: '10mb' }),
	expressMiddleware(server, {
		context: async ({ req }) => {
			const auth = req.headers.authorization ?? '';
			const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
			return { token };
		},
	}),
);

app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

app.listen(port, () => {
	console.log(`GraphQL http://localhost:${port}/graphql`);
});

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import { ensureUserProfileIndexes } from './models.js';
import { resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
	try {
		await mongoose.connect(mongoUri);
		console.log('[database]: connected successfully');
		await ensureUserProfileIndexes();
		console.log('[database]: user profile indexes OK');
	} catch (e) {
		console.warn('[database]: connection or index setup failed', e);
	}
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

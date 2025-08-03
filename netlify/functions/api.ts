import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import { Handler } from '@netlify/functions';

const app = express();

app.use(express.json());

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Netlify Functions!' });
});

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello, TypeScript with Netlify Functions!' });
});

export const handler: Handler = serverless(app);
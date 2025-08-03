import express, { Request, Response } from 'express';
import serverless from 'serverless-http';

const app = express();

app.use(express.json());

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Netlify Functions!' });
});

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello, TypeScript with Netlify Functions!' });
});

export const handler = serverless(app);
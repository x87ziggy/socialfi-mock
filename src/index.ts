import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Local development server' });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from local API!' });
});

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello, TypeScript with Express!' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

export default app;

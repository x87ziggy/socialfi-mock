import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import crypto from 'crypto';

const app = express();

app.use(express.json());

function generateRefCode(publicKey: string): string {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

app.get('/api/refcode/:publicKey', (req: Request, res: Response) => {
  const { publicKey } = req.params;
  
  if (!publicKey || publicKey.length < 32) {
    return res.status(400).json({ error: 'Invalid Solana public key' });
  }
  
  const refCode = generateRefCode(publicKey);
  
  res.json({ 
    publicKey,
    refCode 
  });
});

app.get('/api/referrals/:refCode', (req: Request, res: Response) => {
  const { refCode } = req.params;
  
  if (!refCode) {
    return res.status(400).json({ error: 'Ref code required' });
  }
  
  const mockReferrals = [
    '7Xf9...abc1',
    '8Kg2...def2', 
    '9Lh3...ghi3',
    '4Mn5...jkl4',
    '2Bp8...mno5'
  ];
  
  res.json({
    refCode,
    referrals: mockReferrals,
    count: mockReferrals.length
  });
});

export const handler = serverless(app);
import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import crypto from 'crypto';

const app = express();

app.use(express.json());

// In-memory storage
const referralMap = new Map<string, string>(); // publicKey -> refCode that referred them
const referredByCode = new Map<string, Set<string>>(); // refCode -> Set of publicKeys referred

function generateRefCode(publicKey: string): string {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

app.get('/api/user/:publicKey', (req: Request, res: Response) => {
  const { publicKey } = req.params;
  
  if (!publicKey || publicKey.length < 32) {
    return res.status(400).json({ error: 'Invalid Solana public key' });
  }
  
  const refCode = generateRefCode(publicKey);
  
  res.json({ 
    publicKey,
    refCode,
    points: 0
  });
});

app.post('/api/claim-referral/:refCode/:publicKey', (req: Request, res: Response) => {
  const { refCode, publicKey } = req.params;
  
  if (!refCode) {
    return res.status(400).json({ error: 'Ref code required' });
  }
  
  if (!publicKey || publicKey.length < 32) {
    return res.status(400).json({ error: 'Invalid Solana public key' });
  }
  
  // Check if this public key has already been referred
  if (referralMap.has(publicKey)) {
    return res.status(400).json({ 
      error: 'Public key has already been referred',
      publicKey 
    });
  }
  
  // Store the referral
  referralMap.set(publicKey, refCode);
  
  // Add to the refCode's referred list
  if (!referredByCode.has(refCode)) {
    referredByCode.set(refCode, new Set());
  }
  referredByCode.get(refCode)!.add(publicKey);
  
  res.json({
    success: true,
    message: 'Referral recorded successfully',
    publicKey,
    refCode
  });
});

app.get('/api/leaderboard', (req: Request, res: Response) => {
  // Mock leaderboard data - top 10 users
  const mockLeaderboard = [
    { rank: 1, publicKey: 'DYw8...hKx1', points: 15420, volume: 284500.50 },
    { rank: 2, publicKey: 'Gx9p...mNv2', points: 12350, volume: 195800.75 },
    { rank: 3, publicKey: 'Aw3k...qTz3', points: 9875, volume: 142300.25 },
    { rank: 4, publicKey: 'Hj5m...rBx4', points: 8920, volume: 128900.00 },
    { rank: 5, publicKey: 'Kl7n...sDy5', points: 7650, volume: 98750.80 },
    { rank: 6, publicKey: 'Mn9q...tEz6', points: 6430, volume: 87600.45 },
    { rank: 7, publicKey: 'Pr1s...uFa7', points: 5210, volume: 65400.90 },
    { rank: 8, publicKey: 'Qt3u...vGb8', points: 4580, volume: 54200.35 },
    { rank: 9, publicKey: 'Rv5w...wHc9', points: 3950, volume: 43100.60 },
    { rank: 10, publicKey: 'Sx7y...xId0', points: 3200, volume: 38500.15 }
  ];
  
  res.json({
    leaderboard: mockLeaderboard,
    lastUpdated: new Date().toISOString()
  });
});

export const handler = serverless(app);
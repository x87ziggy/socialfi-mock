import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const app = express();
app.use(express.json());

// Blob store names
const REFERRAL_STORE = 'referrals';
const REF_CODE_STORE = 'refcodes';

// Fallback in-memory storage for local development
const localStorage = {
  referrals: new Map<string, string>(),
  refCodes: new Map<string, string[]>()
};

// Helper to check if we have blob access (linked site or deployed)
const hasBlobs = !!process.env.NETLIFY_SITE_ID || process.env.NETLIFY_BLOBS_CONTEXT === 'deploy';

function generateRefCode(publicKey: string): string {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

function verifySignature(publicKey: string, message: string, signature: string): boolean {
  try {
    const publicKeyBytes = bs58.decode(publicKey);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
}

app.get('/api/user/:publicKey', async (req: Request, res: Response) => {
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

app.post('/api/claim-referral/:refCode/:publicKey', async (req: Request, res: Response) => {
  const { refCode, publicKey } = req.params;
  
  // Parse body if it's a Buffer
  let body = req.body;
  if (Buffer.isBuffer(req.body)) {
    try {
      body = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
  }
  
  const { signature, message } = body;
  
  if (!refCode) {
    return res.status(400).json({ error: 'Ref code required' });
  }
  
  if (!publicKey || publicKey.length < 32) {
    return res.status(400).json({ error: 'Invalid Solana public key' });
  }
  
  if (!signature || !message) {
    return res.status(400).json({ error: 'Signature and message required for verification' });
  }
  
  // Verify the signature to ensure the caller owns the public key
  if (!verifySignature(publicKey, message, signature)) {
    return res.status(401).json({ 
      error: 'Invalid signature - unable to verify ownership of public key' 
    });
  }
  
  // Verify the message contains the refCode to prevent replay attacks
  if (!message.includes(refCode)) {
    return res.status(400).json({ 
      error: 'Message must contain the referral code' 
    });
  }
  
  try {
    if (hasBlobs) {
      // Use Netlify Blobs in production
      const { getStore } = await import('@netlify/blobs');
      const referralStore = getStore(REFERRAL_STORE);
      const refCodeStore = getStore(REF_CODE_STORE);
      
      // Check if this public key has already been referred
      const existingReferral = await referralStore.get(publicKey);
      if (existingReferral) {
        return res.status(400).json({ 
          error: 'Public key has already been referred',
          publicKey 
        });
      }
      
      // Store the referral (publicKey -> refCode)
      await referralStore.set(publicKey, refCode);
      
      // Get current list of public keys for this refCode
      const refCodeDataStr = await refCodeStore.get(refCode);
      const refCodeData = refCodeDataStr ? JSON.parse(refCodeDataStr) : { referrals: [] };
      
      // Add the new public key to the list
      if (!refCodeData.referrals.includes(publicKey)) {
        refCodeData.referrals.push(publicKey);
        await refCodeStore.set(refCode, JSON.stringify(refCodeData));
      }
    } else {
      // Use local storage in development
      if (localStorage.referrals.has(publicKey)) {
        return res.status(400).json({ 
          error: 'Public key has already been referred',
          publicKey 
        });
      }
      
      localStorage.referrals.set(publicKey, refCode);
      
      if (!localStorage.refCodes.has(refCode)) {
        localStorage.refCodes.set(refCode, []);
      }
      const referrals = localStorage.refCodes.get(refCode)!;
      if (!referrals.includes(publicKey)) {
        referrals.push(publicKey);
      }
    }
    
    res.json({
      success: true,
      message: 'Referral recorded successfully',
      publicKey,
      refCode,
      storage: hasBlobs ? 'blobs' : 'memory'
    });
  } catch (error) {
    console.error('Error storing referral:', error);
    res.status(500).json({ error: 'Failed to store referral' });
  }
});

app.get('/api/debug/storage', async (req: Request, res: Response) => {
  try {
    if (hasBlobs) {
      const { getStore } = await import('@netlify/blobs');
      const referralStore = getStore(REFERRAL_STORE);
      const refCodeStore = getStore(REF_CODE_STORE);
      
      // Get all referrals
      const referralList = await referralStore.list();
      const referrals = [];
      
      for (const key of referralList.blobs) {
        const value = await referralStore.get(key.key);
        referrals.push({
          publicKey: key.key.substring(0, 8) + '...',
          referredBy: value
        });
      }
      
      // Get all ref codes
      const refCodeList = await refCodeStore.list();
      const refCodes = [];
      
      for (const key of refCodeList.blobs) {
        const dataStr = await refCodeStore.get(key.key);
        const data = dataStr ? JSON.parse(dataStr) : { referrals: [] };
        refCodes.push({
          refCode: key.key,
          referredCount: data.referrals.length
        });
      }
      
      res.json({
        storage: 'blobs',
        referralCount: referrals.length,
        referrals,
        refCodes
      });
    } else {
      // Use local storage
      const referrals = Array.from(localStorage.referrals.entries()).map(([pk, ref]) => ({
        publicKey: pk.substring(0, 8) + '...',
        referredBy: ref
      }));
      
      const refCodes = Array.from(localStorage.refCodes.entries()).map(([code, keys]) => ({
        refCode: code,
        referredCount: keys.length
      }));
      
      res.json({
        storage: 'memory',
        referralCount: referrals.length,
        referrals,
        refCodes
      });
    }
  } catch (error) {
    console.error('Error fetching storage:', error);
    res.status(500).json({ error: 'Failed to fetch storage data' });
  }
});

app.get('/api/leaderboard', async (req: Request, res: Response) => {
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
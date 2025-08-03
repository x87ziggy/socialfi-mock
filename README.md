# SocialFi Mock Backend

A serverless backend API for a SocialFi referral system built with TypeScript and Netlify Functions.

## Setup

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
npm install
```

## Development

### Local Development
Run the Netlify Dev server locally:
```bash
npm run dev
```
This will start the server at `http://localhost:8888`

### Build for Production
```bash
npm run build
```

## API Endpoints

### 1. Get User Info
**GET** `/api/user/:publicKey`

Returns user information including their referral code and points.

**Parameters:**
- `publicKey` (string): Solana wallet public key

**Response:**
```json
{
  "publicKey": "7xKXtg2CW6kkb96...",
  "refCode": "ABC123DE",
  "points": 0
}
```

### 2. Claim Referral
**POST** `/api/claim-referral/:refCode/:publicKey`

Records that a user was referred by another user's referral code. Each user can only be referred once.

**Parameters:**
- `refCode` (string): The referral code of the referrer
- `publicKey` (string): Solana wallet public key of the user being referred

**Success Response:**
```json
{
  "success": true,
  "message": "Referral recorded successfully",
  "publicKey": "7xKXtg2CW6kkb96...",
  "refCode": "ABC123DE"
}
```

**Error Response (if already referred):**
```json
{
  "error": "Public key has already been referred",
  "publicKey": "7xKXtg2CW6kkb96..."
}
```

### 3. Get Leaderboard
**GET** `/api/leaderboard`

Returns the top 10 users ranked by points with their trading volume.

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "publicKey": "DYw8...hKx1",
      "points": 15420,
      "volume": 284500.50
    },
    ...
  ],
  "lastUpdated": "2024-08-03T12:00:00.000Z"
}
```

## Deployment

### Deploy to Netlify

1. Push your code to a GitHub repository
2. Connect your GitHub repo to Netlify
3. Netlify will automatically detect the configuration and deploy

### Manual Deploy
```bash
netlify deploy --prod
```

## Project Structure

```
mockbe/
├── netlify/
│   └── functions/
│       └── api.ts          # Main API handler
├── dist/                   # Compiled output (generated)
├── netlify.toml           # Netlify configuration
├── tsconfig.json          # TypeScript configuration
├── tsconfig.functions.json # TypeScript config for functions
├── nodemon.json           # Nodemon configuration
├── package.json           # Project dependencies
└── README.md             # This file
```

## Notes

- Referral codes are generated deterministically using SHA-256 hash of the public key
- Data is stored in memory and will reset on function restarts
- All endpoints are serverless functions that scale automatically

## Testing

### Test with curl

Get user info:
```bash
curl http://localhost:8888/api/user/7xKXtg2CW6kkb96RqXN3J3mWJtMSPRDm8p8gKkPyVUZZ
```

Claim a referral:
```bash
curl -X POST http://localhost:8888/api/claim-referral/ABC123DE/8yLYtg3DX7llc97SrYO4K4nXKuNTQSEn9q9hLlQzWVaA
```

Get leaderboard:
```bash
curl http://localhost:8888/api/leaderboard
```
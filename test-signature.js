const nacl = require('tweetnacl');
const bs58 = require('bs58').default || require('bs58');

// Generate a new keypair for testing
const keypair = nacl.sign.keyPair();

// Get the public key in base58 format
const publicKey = bs58.encode(keypair.publicKey);

// Create the message
const refCode = 'ABC123DE';
const message = `Claiming referral with code: ${refCode}`;

// Sign the message
const messageBytes = new TextEncoder().encode(message);
const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
const signatureBase58 = bs58.encode(signature);

console.log('Test Keypair Generated:');
console.log('Public Key:', publicKey);
console.log('Message:', message);
console.log('Signature:', signatureBase58);
console.log('\nCURL command:');
console.log(`curl -X POST "http://localhost:8888/api/claim-referral/${refCode}/${publicKey}" -H "Content-Type: application/json" -d '{"signature":"${signatureBase58}","message":"${message}"}'`);
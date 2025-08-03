const nacl = require('tweetnacl');
const bs58 = require('bs58').default || require('bs58');

// Use the same keypair from before (in real scenario, this would be stored)
const secretKeyBase58 = 'HS8UmghGPdg5VHtcrL1G8kVsU6fLjqF8JQHiwRz1uEcWtvJq5PvfRoxqsAKxT3qzs4qGp9X5JXvU8gH6NLyfV3i';
const publicKeyBase58 = 'FCbpZ2reipJN9FS1HLJDH93evm5ZgLE5cYzZrkC6A7UY';

// For this test, we'll recreate the keypair
const keypair = nacl.sign.keyPair();
const publicKey = bs58.encode(keypair.publicKey);

// Create the message with different ref code
const refCode = 'XYZ789AB';
const message = `Claiming referral with code: ${refCode}`;

// Sign the message
const messageBytes = new TextEncoder().encode(message);
const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
const signatureBase58 = bs58.encode(signature);

console.log('Using same public key:', publicKey);
console.log('New message:', message);
console.log('New signature:', signatureBase58);
console.log('\nThis should fail because the public key was already referred!');
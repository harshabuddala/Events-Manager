import { SignJWT } from 'jose';
import dotenv from 'dotenv';
dotenv.config();

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const token = await new SignJWT({ id: '1', email: 'admin@edunura.com', name: 'Admin User', role: 'ADMIN' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);

const headers = { 'Cookie': `auth-token=${token}` };
const promises = [
  fetch('http://localhost:8472/api/auth/me', { headers }).then(r => r.status),
  fetch('http://localhost:8472/api/dashboard', { headers }).then(r => r.status)
];

console.log("Results:", await Promise.all(promises));

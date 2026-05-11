// generate_admin_jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_change_this_in_production'; // Use your JWT_SECRET from .env

// You can add any payload you want. Here, we use a special admin flag.
const payload = {
  admin: true,
  role: 'admin',
  batch: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days expiry
};

const token = jwt.sign(payload, JWT_SECRET);
console.log('Admin JWT:', token);

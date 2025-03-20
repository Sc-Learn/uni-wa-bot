// create function to encode and validate token
import jwt from 'jsonwebtoken';

export const encode = (payload) => jwt.sign(payload, 'secret', { expiresIn: '30m' });

export const decode = (token) => jwt.verify(token, 'secret');

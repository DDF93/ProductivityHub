import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '../../.env.test') });
}
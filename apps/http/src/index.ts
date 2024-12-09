import express from 'express';
import { router } from './routes/v1';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

export const client = new PrismaClient();

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1', router);

app.listen(process.env.PORT || 3000, () => {
  console.log('server is running on 3000');
});

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// favorites endpoints
app.get('/favorites', (req, res) => {
    res.json({ message: 'Favorites endpoint working!' });
  });
  
  app.post('/favorites', (req, res) => {
    res.json({ message: 'Favorite saved!' });
  });



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

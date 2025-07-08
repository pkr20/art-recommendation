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
app.get('/favorites', async (req, res) => {
    try {
        const favorites = await prisma.favorite.findMany();
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch favorites', details: error.message });
    }
});


//post to favorites
app.post('/favorites', async (req, res) => {
    const { placeId } = req.body;
    try {
        const favorite = await prisma.favorite.create({
            data: { placeId },
        });
        res.json(favorite);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save favorite', details: error.message });
    }
});


//delete from favorites
app.delete('/favorites/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.favorite.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Favorite deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete favorite', details: error.message });
    }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

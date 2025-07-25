import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;


app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // allow frontend URL
  credentials: true, // allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// favorites endpoints
app.get('/favorites', async (req, res) => {
    const userId = req.cookies.session;
    if (!userId) return res.status(401).json({ error: 'Not logged in' });
    try {
        const favorites = await prisma.favorite.findMany({ where: { userId } });
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch favorites', details: error.message });
    }
});


//post to favorites
app.post('/favorites', async (req, res) => {
    const userId = req.cookies.session;
    if (!userId) return res.status(401).json({ error: 'Not logged in' });
    const { placeId } = req.body;
    try {
        const favorite = await prisma.favorite.create({
            data: { placeId, userId },
        });
        res.json(favorite);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save favorite', details: error.message });
    }
});

// GET check if a place is a favorite
app.get('/favorites/:placeId', async (req, res) => {
    const userId = req.cookies.session;
    if (!userId) return res.status(401).json({ error: 'Not logged in' });
    const { placeId } = req.params;
    try {
        const favorite = await prisma.favorite.findUnique({ where: { userId_placeId: { userId, placeId } } });
        res.json({ isFavorite: !!favorite });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check favorite', details: error.message });
    }
});

//delete from favorites
app.delete('/favorites/:placeId', async (req, res) => {
    const userId = req.cookies.session;
    if (!userId) return res.status(401).json({ error: 'Not logged in' });
    const { placeId } = req.params;
    try {
        await prisma.favorite.delete({ where: { userId_placeId: { userId, placeId } } });
        res.json({ message: 'Favorite deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete favorite', details: error.message });
    }
});

// cookie session management endpoints 

//login endpoint: sets a session cookie
app.post('/api/login', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  //use userId as session token
  const sessionToken = userId;
  res.cookie('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // a day
  });
  res.json({ message: 'Logged in' });
});

//logout endpoint: clears the session cookie
app.post('/api/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ message: 'Logged out' });
});

//session check endpoint: verifies if session cookie exists
app.get('/api/session', (req, res) => {
  const sessionToken = req.cookies.session;
  if (sessionToken) {
    res.json({ loggedIn: true, userId: sessionToken });
  } else {
    res.json({ loggedIn: false });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

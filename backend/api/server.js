import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// function that log API errors to database
async function logApiError(req, res, error, statusCode = 500) {
  try {
    await prisma.apiError.create({
      data: {
        endpoint: req.path,
        method: req.method,
        errorMessage: error.message || 'Unknown error',
        stackTrace: error.stack,
        userId: req.cookies?.session || null,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null,
        statusCode: statusCode
      }
    });
  } catch (logError) {
    console.error('Failed to log API error:', logError);
  }
}

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
        await logApiError(req, res, error);
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
        await logApiError(req, res, error);
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
        await logApiError(req, res, error);
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
        await logApiError(req, res, error);
        res.status(500).json({ error: 'Failed to delete favorite', details: error.message });
    }
});

// cookie session management endpoints 

//login endpoint: sets a session cookie
app.post('/api/login', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      const error = new Error('Missing userId');
      await logApiError(req, res, error, 400);
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
  } catch (error) {
    await logApiError(req, res, error, 500);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

//logout endpoint: clears the session cookie
app.post('/api/logout', async (req, res) => {
  try {
    res.clearCookie('session');
    res.json({ message: 'Logged out' });
  } catch (error) {
    await logApiError(req, res, error, 500);
    res.status(500).json({ error: 'Logout failed', details: error.message });
  }
});

//session check endpoint: verifies if session cookie exists
app.get('/api/session', async (req, res) => {
  try {
    const sessionToken = req.cookies.session;
    if (sessionToken) {
      res.json({ loggedIn: true, userId: sessionToken });
    } else {
      res.json({ loggedIn: false });
    }
  } catch (error) {
    await logApiError(req, res, error, 500);
    res.status(500).json({ error: 'Session check failed', details: error.message });
  }
});

// API error logs endpoint
app.get('/api/errors', async (req, res) => {
  try {
    const { limit = 50, offset = 0, statusCode, endpoint } = req.query;
    
    const where = {};
    if (statusCode) where.statusCode = parseInt(statusCode);
    if (endpoint) where.endpoint = { contains: endpoint };
    
    const errors = await prisma.apiError.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        endpoint: true,
        method: true,
        errorMessage: true,
        statusCode: true,
        userId: true,
        ipAddress: true,
        createdAt: true
      }
    });
    
    const total = await prisma.apiError.count({ where });
    
    res.json({
      errors,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Failed to get error logs:', error);
    res.status(500).json({ error: 'Failed to get error logs' });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

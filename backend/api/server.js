import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
  origin: FRONTEND_URL,
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

// Review endpoints

// GET all reviews for a place
app.get('/reviews/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const { limit = 20, offset = 0, rating } = req.query;
    
    const where = { placeId };
    if (rating) where.rating = parseInt(rating);
    
    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        helpful: true,
        userId: true
      }
    });
    const total = await prisma.review.count({where});
    const avgRating = await prisma.review.aggregate({
      where: {placeId},
      _avg: {rating: true },
      _count: { rating: true }
    });
    res.json({
      reviews,
      stats: {
        total,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: avgRating._count.rating || 0
      },
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    await logApiError(req, res, error);
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
});

//POST create a new review
app.post('/reviews', async (req, res) => {
  const userId = req.cookies.session;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  
  try {
    const { placeId, rating, comment } = req.body;
    if (!placeId || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const review = await prisma.review.create({
      data: {
        placeId,
        userId,
        rating,
        comment
      }
    });
    res.json(review);
  } catch (error) {
    await logApiError(req, res, error);
    res.status(500).json({ error: 'Failed to create review', details: error.message });
  }
});



//PUT update an existing review
app.put('/reviews/:reviewId', async (req, res) => {
  const userId = req.cookies.session;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  
  try {
    const {reviewId } = req.params;
    const { rating, comment } = req.body;
    
    const review = await prisma.review.findUnique({
      where: { id: parseInt(reviewId) }
    });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'cannot update this review' });
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: { rating, comment }
    });
    
    res.json(updatedReview);
  } catch (error) {
    await logApiError(req, res, error);
    res.status(500).json({ error: 'Failed to update review', details: error.message });
  }
});

//DELETE a review
app.delete('/reviews/:reviewId', async (req, res) => {
  const userId = req.cookies.session;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  
  try {
    const { reviewId } = req.params;
    const review = await prisma.review.findUnique({
      where: { id: parseInt(reviewId) }
    });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'cannot delete this review' });
    }
    
    await prisma.review.delete({
      where: { id: parseInt(reviewId) }
    });
    res.json({ message: 'Review deleted ' });
  } catch (error) {
    await logApiError(req, res, error);
    res.status(500).json({ error: 'Failed to delete review', details: error.message });
  }
});

//GET user's reviews
app.get('/user/reviews', async (req, res) => {
  const userId = req.cookies.session;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  
  try {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(reviews);
  } catch (error) {
    await logApiError(req, res, error);
    res.status(500).json({ error: 'Failed to fetch user reviews', details: error.message });
  }
});

// POST mark review as helpful
app.post('/reviews/:reviewId/helpful', async (req, res) => {
  const userId = req.cookies.session;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { reviewId } = req.params;
    const review = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: { helpful: { increment: 1 } }
    });
    
    res.json({ helpful: review.helpful });
  } catch (error) {
    await logApiError(req, res, error);
    res.status(500).json({ error: 'Failed to mark review as helpful', details: error.message });
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

});

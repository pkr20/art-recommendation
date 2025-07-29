import React, { useState, useEffect } from 'react';

const ReviewList = ({ placeId, currentUserId, onReviewUpdate }) => {
  const [reviews, setReviews] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchReviews();
  }, [placeId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${placeId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
        if (onReviewUpdate) onReviewUpdate();
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-list">
      <h3>Reviews ({reviews.length})</h3>
      
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div>
          {reviews.map(review => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                {renderStars(review.rating)}
                {currentUserId === review.userId && (
                  <button 
                    onClick={() => handleDeleteReview(review.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p>{review.comment}</p>
              <small>{new Date(review.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList; 
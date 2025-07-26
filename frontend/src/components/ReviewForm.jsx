import React, { useState } from 'react';

const ReviewForm = ({ placeId, onSubmit, onCancel, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;

    try {
      const url = existingReview 
        ? `${API_BASE_URL}/reviews/${existingReview.id}`
        : `${API_BASE_URL}/reviews`;
      
      const method = existingReview ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ placeId, rating, comment: comment.trim() })
      });

      if (response.ok) {
        const review = await response.json();
        onSubmit(review);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  return (
    <div className="review-form">
      <h3>{existingReview ? 'Edit Review' : 'Write Review'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="rating-section">
          <label>Rating: </label>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`star-btn ${star <= rating ? 'filled' : ''}`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="comment-section">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
            rows={4}
            className="review-textarea"
          />
        </div>

        <div className="form-buttons">
          <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          <button 
            type="submit" 
            disabled={rating === 0 || !comment.trim()}
            className="submit-btn"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm; 
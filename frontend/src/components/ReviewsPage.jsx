import React, { useState, useEffect } from 'react';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

const ReviewsPage = ({ placeId, placeName, user, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [userReview, setUserReview] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (user) {
      fetchUserReview();
    }
  }, [user, placeId]);

  const fetchUserReview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/reviews`, {
        credentials: 'include'
      });

      if (response.ok) {
        const reviews = await response.json();
        const userReviewForPlace = reviews.find(review => review.placeId === placeId);
        setUserReview(userReviewForPlace || null);
      }
    } catch (err) {
      console.error('Failed to fetch user review:', err);
    }
  };

  const handleReviewSubmit = (review) => {
    setUserReview(review);
    setShowForm(false);
    window.location.reload();
  };

  const handleReviewUpdate = () => {
    fetchUserReview();
  };

  return (
    <div className="reviews-modal">
      <div className="reviews-modal-content">
        <div className="reviews-modal-header">
          <h2>Reviews for {placeName}</h2>
          <button className="reviews-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="reviews-modal-body">
          {user && (
            <div className="user-review-section">
              {userReview ? (
                <div className="user-review-card">
                  <div className="user-review-header">
                    <h4>Your Review</h4>
                    <div className="user-review-actions">
                      <button onClick={() => setShowForm(true)} className="edit-btn">
                        Edit
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Delete your review?')) {
                            try {
                              const response = await fetch(`${API_BASE_URL}/reviews/${userReview.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                              });
                              if (response.ok) {
                                setUserReview(null);
                                window.location.reload();
                              }
                            } catch (err) {
                              console.error('Failed to delete review:', err);
                            }
                          }
                        }}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="user-review-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star ${star <= userReview.rating ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p>{userReview.comment}</p>
                  <small>{new Date(userReview.createdAt).toLocaleDateString()}</small>
                </div>
              ) : (
                <div className="write-review-section">
                  <h4>Write a Review</h4>
                  <button onClick={() => setShowForm(true)} className="write-review-btn">
                    Write Review
                  </button>
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="form-modal-overlay">
              <div className="form-modal">
                <ReviewForm
                  placeId={placeId}
                  onSubmit={handleReviewSubmit}
                  onCancel={() => setShowForm(false)}
                  existingReview={userReview}
                />
              </div>
            </div>
          )}

          <ReviewList
            placeId={placeId}
            currentUserId={user?.userId}
            onReviewUpdate={handleReviewUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage; 
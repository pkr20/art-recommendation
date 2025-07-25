import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Tooltip from './Tooltip';

function getPriceLevel(level) {
  if (level === 0) return 'Free';
  if (level === 1) return '$';
  if (level === 2) return '$$';
  if (level === 3) return '$$$';
  if (level === 4) return '$$$$';
  return 'Unknown';
}

function PlacePage() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // to add a favorite to localstorage
  const addFavorite = (placeId, types) => {
    let favorites = JSON.parse(localStorage.getItem('artBase_favorites') || '[]');
    // check if already favorited (by id)
    const already = favorites.some(fav => (typeof fav === 'object' && fav.id === placeId) || fav === placeId);
    if (!already) {
      favorites.push({ id: placeId, types: types });
      localStorage.setItem('artBase_favorites', JSON.stringify(favorites));
    }
  };
  
  // to remove a favorite from local storage
  const removeFavorite = (placeId) => {
    let favorites = JSON.parse(localStorage.getItem('artBase_favorites') || '[]');
    //remove by id property if object, or by value if string
    const updated = favorites.filter(fav => {
      if (typeof fav === 'object' && fav !== null && fav.id) {
        return fav.id !== placeId;
      } else {
        return fav !== placeId;
      }
    });
    localStorage.setItem('artBase_favorites', JSON.stringify(updated));
  }; 
  

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = fetchDetails;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    } else {
      fetchDetails();
    }
    function fetchDetails() {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);
      service.getDetails({ placeId }, (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setDetails(result);
        } else {
          setError('Cannot fetch place details.');
        }
      });
    }
  }, [placeId]);

  //set isFavorite
  useEffect(() => {
    fetch(`http://localhost:3000/favorites/${placeId}`)
      .then(res => res.json())
      .then(data => 
        setIsFavorite(data.isFavorite)
      );
  }, [placeId]);

  // favoriting a card only once
  const handleFavorite = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch('http://localhost:3000/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId }),
      });
      if (response.ok) {
        setIsFavorite(true);
      }
      //use details.place_id and details.types for storing
      if (details && details.place_id && details.types) {
        addFavorite(details.place_id, details.types);
      } else {
        // fallback: just store the id
        addFavorite(placeId, []);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  // delete from favorites by placeId
  const handleUnfavorite = async () => {
    try {
      const response = await fetch(`http://localhost:3000/favorites/${placeId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setIsFavorite(false);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
    removeFavorite(placeId)
  };

  if (error) {
    return <div className="placepage-container">{error}</div>;
  }
  if (!details) {
    return <div className="placepage-container">Loading place details...</div>;
  }

  return (
    <div className="placepage-container">
      <button className="placepage-back-btn" onClick={() => navigate(-1)}>← Back</button>
      <div className="placepage-info-panel">
        {isFavorite ? (
          <Tooltip text="Remove from your favorites">
            <button className="unfavorite-btn" onClick={handleUnfavorite}>Unfavorite ♥ </button>
          </Tooltip>
        ) : (
          <Tooltip text="Add to your favorites!">
            <button className="favorite-btn" onClick={handleFavorite}>Favorite ♡ </button>
          </Tooltip>
        )}
        <h1 className="placepage-title">{details.name}</h1>
        <p className="placepage-address">{details.formatted_address || details.vicinity}</p>
      </div>
      {details.photos && details.photos.length > 0 && (
        <div className="placepage-photo-reel">
          {details.photos.slice(0, 8).map((photo, idx) => (
            <img
              key={idx}
              src={photo.getUrl({ maxWidth: 400, maxHeight: 300 })}
              alt={details.name + ' photo ' + (idx + 1)}
              className="placepage-photo"
            />
          ))}
        </div>
      )}
      <div className="placepage-section">
        <strong>Rating:</strong> {details.rating} ({details.user_ratings_total} reviews)
      </div>
      <div className="placepage-section">
        <strong>Price Level:</strong> {getPriceLevel(details.price_level)}
      </div>
      {details.opening_hours && details.opening_hours.weekday_text && (
        <div className="placepage-section">
          <strong>Opening Hours:</strong>
          <div>
            {details.opening_hours.weekday_text.map((line, id) => (
              <div key={id}>{line}</div>
            ))}
          </div>
        </div>
      )}
      {details.reviews && details.reviews.length > 0 && (
        <div className="placepage-section">
          <strong>Top Reviews:</strong>
          <div>
            {details.reviews.slice(0, 3).map((review, id) => (
              <div key={id} className="placepage-review">
                <div><strong>{review.author_name}</strong> ({review.rating} ★):</div>
                <div>{review.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacePage;
import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    //load Google Maps script if not already loaded
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

  if (error) {
    return <div >{error}</div>;
  }
  if (!details) {
    return <div >No details found.</div>;
  }

  return (
    <div >
      <button onClick={() => navigate(-1)}>Back</button>
      <h1>{details.name}</h1>
      <p>{details.formatted_address || details.vicinity}</p>
      {details.photos && details.photos.length > 0 && (
        <img src={details.photos[0].getUrl()} alt={details.name} style={{ width: '100%', maxWidth: 400 }} />
      )}
      <div >
        <strong>Rating:</strong> {details.rating} ({details.user_ratings_total} reviews)
      </div>
      <div>
        <strong>Price Level:</strong> {getPriceLevel(details.price_level)}
      </div>
      {details.opening_hours && details.opening_hours.weekday_text && (
        <div >
          <strong>Opening Hours:</strong>
          <div>
            {details.opening_hours.weekday_text.map((line, id) => (
              <div key={id}>{line}</div>
            ))}
          </div>
        </div>
      )}
      {details.reviews && details.reviews.length > 0 && (
        <div >
          <strong>Top Reviews:</strong>
          <div>
            {details.reviews.slice(0, 3).map((review, id) => (
              <div key={id} >
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
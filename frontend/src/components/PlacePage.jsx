import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

function PlacePage() {
  const { placeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const place = location.state?.place;

  if (!place) {
    return (
      <div>
        
        <p>Place ID: {placeId}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate(-1)} >Back</button>
      <h1>{place.name}</h1>
      <p>{place.vicinity || place.location}</p>
      <img src={place.photoUrl} alt={place.name} style={{ width: '100%', maxWidth: 400 }} />

    </div>
  );
}

export default PlacePage;
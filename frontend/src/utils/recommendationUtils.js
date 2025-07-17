// recommendation algorithm and distance calculation utilities

export function calculateDistance(userLocation, placeLocation) {
  const lat1 = userLocation.lat;
  const lng1 = userLocation.lng;
  const lat2 = typeof placeLocation.lat === 'function' ? placeLocation.lat() : placeLocation.lat;
  const lng2 = typeof placeLocation.lng === 'function' ? placeLocation.lng() : placeLocation.lng;
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

export function rankSearchResults(placesToRank, userLocation) {
  const DISTANCE_WEIGHT = 0.3;
  const PRICE_WEIGHT = 0.25;
  const RATING_WEIGHT = 0.2;
  const TYPE_WEIGHT = 0.2;
  const maxDistance = 50000;
  const maxPrice = 4;
  const maxRating = 5;
    // caching favorites and interactions
  const favorites = JSON.parse(localStorage.getItem('artBase_favorites') || '[]');
  const interactions = JSON.parse(localStorage.getItem('artBase_userInteractions') || '{}');
  const viewedIds = Object.keys(interactions);
    //same types are ranked higher
  const typeCounts = {};
  favorites.forEach(id => {
    const place = placesToRank.find(p => p.place_id === id);
    if (place && place.types) {
      place.types.forEach(type => {
        if (['art_gallery', 'museum', 'art_fair', 'exhibition'].includes(type)) {
          typeCounts[type] = (typeCounts[type] || 0) + 2;
        }
      });
    }
  });
  viewedIds.forEach(id => {
    if (favorites.includes(id)) return;
    const place = placesToRank.find(p => p.place_id === id);
    if (place && place.types) {
      place.types.forEach(type => {
        if (['art_gallery', 'museum', 'art_fair', 'exhibition'].includes(type)) {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
      });
    }
  });
  const totalTypeCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);
  
  return placesToRank.map(place => {
    const distance = place.geometry?.location && userLocation
      ? calculateDistance(userLocation, place.geometry.location)
      : maxDistance;
    const distanceScore = 1 - (distance / maxDistance);
    const priceScore = place.price_level !== undefined ? (1 - (place.price_level / maxPrice)) : 0.5;
    const ratingScore = place.rating !== undefined ? (place.rating / maxRating) : 0.3;
    let typeScore = 0;
    if (place.types) {
      typeScore = place.types.reduce((acc, type) => {
        if (typeCounts[type] && totalTypeCount > 0) {
          return acc + typeCounts[type] / totalTypeCount;
        }
        return acc;
      }, 0);
      typeScore = Math.min(typeScore, 1.0);
    }
    const rankScore =
      DISTANCE_WEIGHT * distanceScore +
      PRICE_WEIGHT * priceScore +
      RATING_WEIGHT * ratingScore +
      TYPE_WEIGHT * typeScore;
    return { ...place, rankScore };
  }).sort((a, b) => b.rankScore - a.rankScore);
} 
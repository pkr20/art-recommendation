// recommendation algorithm 

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

  // same types are ranked higher
  const typeCounts = {};
  for (let i = 0; i < favorites.length; i++) {
    const id = favorites[i];
    const place = placesToRank.find(p => p.place_id === id);
    if (place && place.types) {
      for (let j = 0; j < place.types.length; j++) {
        const type = place.types[j];
        if (
          type === 'art_gallery' ||
          type === 'museum' ||
          type === 'art_fair' ||
          type === 'exhibition'
        ) {
          if (typeCounts[type] === undefined) {
            typeCounts[type] = 0;
          }
          typeCounts[type] += 2;
        }
      }
    }
  }

  for (let i = 0; i < viewedIds.length; i++) {
    const id = viewedIds[i];
    if (favorites.includes(id)) {
      continue;
    }
    const place = placesToRank.find(p => p.place_id === id);
    if (place && place.types) {
      for (let j = 0; j < place.types.length; j++) {
        const type = place.types[j];
        if (
          type === 'art_gallery' ||
          type === 'museum' ||
          type === 'art_fair' ||
          type === 'exhibition'
        ) {
          if (typeCounts[type] === undefined) {
            typeCounts[type] = 0;
          }
          typeCounts[type] += 1;
        }
      }
    }
  }

  const totalTypeCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  return placesToRank
    .map(place => {
      let distance;
      if (place.geometry?.location && userLocation) {
        distance = calculateDistance(userLocation, place.geometry.location);
      } else {
        distance = maxDistance;
      }

      const distanceScore = 1 - (distance / maxDistance);
      const priceScore =
        place.price_level !== undefined
          ? 1 - place.price_level / maxPrice
          : 0.5;
      const ratingScore =
        place.rating !== undefined ? place.rating / maxRating : 0.3;

      let typeScore = 0;
      if (place.types) {
        for (let i = 0; i < place.types.length; i++) {
          const type = place.types[i];
          if (typeCounts[type] && totalTypeCount > 0) {
            typeScore += typeCounts[type] / totalTypeCount;
          }
        }
        typeScore = Math.min(typeScore, 1.0);
      }

      const rankScore =
        DISTANCE_WEIGHT * distanceScore +
        PRICE_WEIGHT * priceScore +
        RATING_WEIGHT * ratingScore +
        TYPE_WEIGHT * typeScore;

      return { ...place, rankScore };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
} 
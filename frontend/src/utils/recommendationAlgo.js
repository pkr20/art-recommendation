// recommendation algorithm 

export function calculateDistance(userLocation, placeLocation) {
  const lat1 = userLocation.lat;
  const lng1 = userLocation.lng;
  const lat2 = typeof placeLocation.lat === 'function' ? placeLocation.lat() : placeLocation.lat;
  const lng2 = typeof placeLocation.lng === 'function' ? placeLocation.lng() : placeLocation.lng;
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

// analyze user preferences for distance, price, and rating
function analyzeUserPreferences(places, favorites, interactions) {
  const viewedIds = Object.keys(interactions);
  let distanceSum = 0;
  let priceSum = 0;
  let ratingSum = 0;
  let count = 0;
  let minDistance = Infinity;
  let maxDistance = -Infinity;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let minRating = Infinity;
  let maxRating = -Infinity;

  //helper to update min/max
  function updateMinMax(val, min, max) {
    if (val < min) {
      min = val;
    }
    if (val > max) {
      max = val;
    }
    return [min, max];
  }

  //collect stats from favorites (higher weight of 2) and views/interactions (weight 1) of what matters more
  const allIds = [...favorites, ...viewedIds];
  for (let idx = 0; idx < allIds.length; idx++) {
    const id = allIds[idx];
    const place = places.find(function(p) {
      return p.place_id === id;
    });
    if (!place) {
      continue;
    }
    let weight;
    if (favorites.includes(id)) {
      weight = 2;
    } else {
      weight = 1;
    }
    // distance
    if (place._userDistance !== undefined) {
      distanceSum += place._userDistance * weight;
      const minMax = updateMinMax(place._userDistance, minDistance, maxDistance);
      minDistance = minMax[0];
      maxDistance = minMax[1];
    }
    // price
    if (place.price_level !== undefined) {
      priceSum += place.price_level * weight;
      const minMax = updateMinMax(place.price_level, minPrice, maxPrice);
      minPrice = minMax[0];
      maxPrice = minMax[1];
    }
    // rating
    if (place.rating !== undefined) {
      ratingSum += place.rating * weight;
      const minMax = updateMinMax(place.rating, minRating, maxRating);
      minRating = minMax[0];
      maxRating = minMax[1];
    }
    count += weight;
  }
  let avgDistance, avgPrice, avgRating;

  if (count) {
    avgDistance = distanceSum / count;
  } else {
    avgDistance = null;
  }
  
  if (count) {
    avgPrice = priceSum / count;
  } else {
    avgPrice = null;
  }
 
  if (count) {
    avgRating = ratingSum / count;
  } else {
    avgRating = null;
  }
  return {
    avgDistance, avgPrice, avgRating, minDistance, maxDistance, minPrice, maxPrice, minRating, maxRating
  };
}

//compare user averages to overall averages
function compareToOverall(userStats, places) {
  let distanceSum = 0;
  let priceSum = 0;
  let ratingSum = 0;
  let count = 0;
  for (let idx = 0; idx < places.length; idx++) {
    const place = places[idx];
    if (place._userDistance !== undefined) {
      distanceSum += place._userDistance;
    }
    if (place.price_level !== undefined) {
      priceSum += place.price_level;
    }
    if (place.rating !== undefined) {
      ratingSum += place.rating;
    }
    count = count + 1;
  }
  let avgDistance, avgPrice, avgRating, distanceDiff, priceDiff, ratingDiff;

  if (count) {
    avgDistance = distanceSum / count;
  } else {
    avgDistance = null;
  }

  if (count) {
    avgPrice = priceSum / count;
  } else {
    avgPrice = null;
  }

  if (count) {
    avgRating = ratingSum / count;
  } else {
    avgRating = null;
  }

  if (userStats.avgDistance !== null && avgDistance !== null) {
    distanceDiff = userStats.avgDistance - avgDistance;
  } else {
    distanceDiff = 0;
  }

  if (userStats.avgPrice !== null && avgPrice !== null) {
    priceDiff = userStats.avgPrice - avgPrice;
  } else {
    priceDiff = 0;
  }

  if (userStats.avgRating !== null && avgRating !== null) {
    ratingDiff = userStats.avgRating - avgRating;
  } else {
    ratingDiff = 0;
  }
  return {
    distance, price, rating
  };
}

//get dynamic weights based on user preferences
function getDynamicWeights(userStats, overallDiffs) {
  //default weights to fall back on
  let DISTANCE_WEIGHT = 0.3;
  let PRICE_WEIGHT = 0.25;
  let RATING_WEIGHT = 0.2;
  let TYPE_WEIGHT = 0.2;

  //if user prefers closer places (avgDistance < overall), increase distance weight
  if (overallDiffs.distance < 0) {
    DISTANCE_WEIGHT = DISTANCE_WEIGHT + 0.1;
    PRICE_WEIGHT = PRICE_WEIGHT - 0.05;
    RATING_WEIGHT = RATING_WEIGHT - 0.05;
  }
  //if user prefers cheaper places (avgPrice < overall), increase price weight
  if (overallDiffs.price < 0) {
    PRICE_WEIGHT = PRICE_WEIGHT + 0.1;
    DISTANCE_WEIGHT = DISTANCE_WEIGHT - 0.05;
    RATING_WEIGHT = RATING_WEIGHT - 0.05;
  }
  //if user prefers higher rated places (avgRating > overall), increase rating weight
  if (overallDiffs.rating > 0) {
    RATING_WEIGHT = RATING_WEIGHT + 0.1;
    DISTANCE_WEIGHT = DISTANCE_WEIGHT - 0.05;
    PRICE_WEIGHT = PRICE_WEIGHT - 0.05;
  }
  //normalize so weights sum to 1
  const total = DISTANCE_WEIGHT + PRICE_WEIGHT + RATING_WEIGHT + TYPE_WEIGHT;
  DISTANCE_WEIGHT = DISTANCE_WEIGHT / total;
  PRICE_WEIGHT = PRICE_WEIGHT / total;
  RATING_WEIGHT = RATING_WEIGHT / total;
  TYPE_WEIGHT = TYPE_WEIGHT / total;
  return {
    DISTANCE_WEIGHT,
    PRICE_WEIGHT,
    RATING_WEIGHT,
    TYPE_WEIGHT
  };
}

export function rankSearchResults(placesToRank, userLocation) {
  const maxDistance = 50000;
  const maxPrice = 4;
  const maxRating = 5;
  // caching favorites and interactions
  const favoritesRaw = localStorage.getItem('artBase_favorites');
  let favorites;
  if (favoritesRaw) {
    favorites = JSON.parse(favoritesRaw);
  } else {
    favorites = [];
  }
  const interactionsRaw = localStorage.getItem('artBase_userInteractions');
  let interactions;
  if (interactionsRaw) {
    interactions = JSON.parse(interactionsRaw);
  } else {
    interactions = {};
  }
  const viewedIds = Object.keys(interactions);

  // same types are ranked higher
  const typeCounts = {};
  for (let i = 0; i < favorites.length; i++) {
    const id = favorites[i];
    const place = placesToRank.find(function(p) {
      return p.place_id === id;
    });
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
          typeCounts[type] = typeCounts[type] + 2;
        }
      }
    }
  }

  for (let i = 0; i < viewedIds.length; i++) {
    const id = viewedIds[i];
    if (favorites.includes(id)) {
      continue;
    }
    const place = placesToRank.find(function(p) {
      return p.place_id === id;
    });
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
          typeCounts[type] = typeCounts[type] + 1;
        }
      }
    }
  }

  let totalTypeCount = 0;
  const typeKeys = Object.keys(typeCounts);
  for (let i = 0; i < typeKeys.length; i++) {
    const key = typeKeys[i];
    totalTypeCount = totalTypeCount + typeCounts[key];
  }

  // precompute user distances for all places to use for avgDistance
  const placesWithDistance = [];
  for (let i = 0; i < placesToRank.length; i++) {
    const place = placesToRank[i];
    let distance;
    if (place.geometry && place.geometry.location && userLocation) {
      distance = calculateDistance(userLocation, place.geometry.location);
    } else {
      distance = maxDistance;
    }
    const placeWithDistance = { ...place, _userDistance: distance };
    placesWithDistance.push(placeWithDistance);
  }

  // analyze user preferences and get dynamic weights
  const userStats = analyzeUserPreferences(placesWithDistance, favorites, interactions);
  const overallDiffs = compareToOverall(userStats, placesWithDistance);
  const weights = getDynamicWeights(userStats, overallDiffs);

  const ranked = [];
  for (let i = 0; i < placesWithDistance.length; i++) {
    const place = placesWithDistance[i];
    let distanceScore = 1 - (place._userDistance / maxDistance);
    
    let priceScore, ratingScore;
    if (place.price_level !== undefined) {
      priceScore = 1 - (place.price_level / maxPrice);
    } else {
      priceScore = 0.5;
    }
  
    if (place.rating !== undefined) {
      ratingScore = place.rating / maxRating;
    } else {
      ratingScore = 0.3;
    }

    let typeScore = 0;
    if (place.types) {
      for (let j = 0; j < place.types.length; j++) {
        const type = place.types[j];
        if (typeCounts[type] && totalTypeCount > 0) {
          typeScore = typeScore + (typeCounts[type] / totalTypeCount);
        }
      }
      if (typeScore > 1.0) {
        typeScore = 1.0;
      }
    }
    const rankScore =
      weights.DISTANCE_WEIGHT * distanceScore +
      weights.PRICE_WEIGHT * priceScore +
      weights.RATING_WEIGHT * ratingScore +
      weights.TYPE_WEIGHT * typeScore;
    const placeWithScore = { ...place, rankScore: rankScore };
    ranked.push(placeWithScore);
  }
  ranked.sort(function(a, b) {
    return b.rankScore - a.rankScore;
  });
  return ranked;
} 
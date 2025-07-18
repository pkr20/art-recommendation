// synonym sets for search
export const SYNONYM_GROUPS = [
  ['gallery', 'galleries', 'art exhibit', 'art space', 'art center'],
  ['museum', 'museums', 'art museum', 'art museums', 'cultural institution', 'cultural institutions'],
  ['modern', 'contemporary', 'abstract']
];

// compute difference between two strings
// returns min number of single-character required to change a to b
// uses dynamic programming o(m * n) time complexity
export function fuzzyAlgo(a, b) {
  if (a === b) {
    return 0;
  }
  if (!a.length) {
    return b.length;
  }
  if (!b.length) {
    return a.length;
  }
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// returns true if term is in text or within 1 letter difference of any word in text
export function fuzzyMatch(term, text) {
  if (text.includes(term)) {
    return true;
  }
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (fuzzyAlgo(words[i], term) <= 1) {
      return true;
    }
  }
  return false;
}

// returns true if two words within 1 letter difference
export function fuzzyWordMatch(a, b) {
  if (fuzzyAlgo(a, b) <= 1) {
    return true;
  } else {
    return false;
  }
}

// expands user search to include fuzzy and synonym matches
// returns an array of all terms to search for
export function expandSearchTermsFuzzy(input) {
  const terms = input.toLowerCase().split(/\s+/);
  let expanded = new Set(terms);
  for (let g = 0; g < SYNONYM_GROUPS.length; g++) {
    const group = SYNONYM_GROUPS[g];
    let groupMatch = false;
    for (let w = 0; w < group.length; w++) {
      const word = group[w];
      for (let t = 0; t < terms.length; t++) {
        const term = terms[t];
        if (fuzzyWordMatch(word, term)) {
          groupMatch = true;
          break;
        }
      }
      if (groupMatch) {
        break;
      }
    }
    if (groupMatch) {
      for (let w = 0; w < group.length; w++) {
        expanded.add(group[w]);
      }
    }
  }
  return Array.from(expanded);
}

// Typeahead suggestion generator
// generates autocomplete suggestions based on user input and available places
export function getSuggestions(searchInput, places) {
  if (!searchInput.trim()) {
    return [];
  }
  const lowerInput = searchInput.toLowerCase();
  const nameSuggestions = places
    .map(place => place.name)
    .filter(name => {
      if (!name) {
        return false;
      }
      return name.toLowerCase().includes(lowerInput);
    });
  const synonymSuggestions = SYNONYM_GROUPS
    .flat()
    .filter(word => {
      return word.includes(lowerInput) && !nameSuggestions.includes(word);
    });
  const allSuggestions = [...nameSuggestions, ...synonymSuggestions]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 7);
  return allSuggestions;
}

// filters list of places based from fuzzy and synonym logic
export function filterPlacesFuzzySynonym(places, searchInput) {
  if (!searchInput.trim()) {
    return places;
  }
  const expandedTerms = expandSearchTermsFuzzy(searchInput);
   console.log(expandedTerms)
  return places.filter(place => {
    const name = place.name ? place.name.toLowerCase() : '';
    const vicinity = place.vicinity ? place.vicinity.toLowerCase() : '';
    for (let i = 0; i < expandedTerms.length; i++) {
      const term = expandedTerms[i];
      if (name.includes(term) || vicinity.includes(term)) {
        return true;
      }
    }
    return false;
  });
}
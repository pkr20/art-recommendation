import { useState, useEffect, useRef } from 'react';
import { getSuggestions } from '../utils/searchAlgorithm';

export default function SearchBar({ searchInput, setSearchInput, places = [] }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const inputRef = useRef(null);

    //update suggestions as user types
    useEffect(() => {
        if (searchInput.trim()) {
            const suggestions = getSuggestions(searchInput, places);
            setSuggestions(suggestions);
            setShowDropdown(suggestions.length > 0);
            setActiveSuggestion(0);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }
    }, [searchInput, places]);

    // handles form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setShowDropdown(false);
    }

    // handles clear
    const handleClear = () => {
        setSearchInput('');
        setSuggestions([]);
        setShowDropdown(false);
    }

    // handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showDropdown) return;
        if (e.key === 'ArrowDown') {
            setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            setActiveSuggestion((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            if (suggestions.length > 0) {
                setSearchInput(suggestions[activeSuggestion]);
                setShowDropdown(false);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    //handle click on suggestion
    const handleSuggestionClick = (suggestion) => {
        setSearchInput(suggestion);
        setShowDropdown(false);
        inputRef.current && inputRef.current.blur();
    };

    return (
        <div className="search-bar">
            <form onSubmit={handleSubmit} className="search-form" autoComplete="off">
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for galleries, museums, fairs..."
                    className="search-input"
                    ref={inputRef}
                    autoComplete="off"
                />
                <button type="submit" className="search-button">
                    Search
                </button>
                <button type="button" onClick={handleClear}>
                    Clear
                </button>
            </form>
            {showDropdown && (
                <ul className="typeahead-dropdown">
                    {suggestions.map((suggestion, idx) => (
                        <li
                            key={suggestion + idx}
                            className={`typeahead-suggestion${idx === activeSuggestion ? ' active-suggestion' : ''}`}
                            onMouseDown={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

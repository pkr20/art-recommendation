import { useState } from 'react';

export default function SearchBar({ searchInput, setSearchInput }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

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

    return (
        <div className="search-bar">
            <form onSubmit={handleSubmit} className="search-form">
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search for galleries, museums, fairs..."
                    className="search-input"
                />
                <button type="submit" className="search-button">
                    Search
                </button>
                <button type="button" onClick={handleClear}>
                    Clear
                </button>
            </form>
        </div>
    )
}

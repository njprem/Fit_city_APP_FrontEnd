import React from 'react';
import { Search } from 'lucide-react';

export interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSearch: () => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, onSearch, placeholder = 'Find Destination Name or ID...' }) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="relative flex w-full max-w-xl">
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow"
            />
            <button
                type="button"
                onClick={onSearch}
                className="absolute right-0 top-0 h-full w-10 text-gray-500 flex items-center justify-center hover:text-indigo-600 transition-colors"
            >
                <Search className="w-5 h-5" />
            </button>
        </div>
    );
};

export default SearchBar;

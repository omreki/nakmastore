import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DELIVERY_NETWORK_LOCATIONS, filterNetworkLocations } from '../../constants/deliveryLocations';

const MIN_SEARCH_LENGTH = 3;

const DeliveryLocationPicker = ({ value, onChange }) => {
    const [query, setQuery] = useState(value?.location || '');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const trimmedQuery = query.trim();
    const canSearch = trimmedQuery.length >= MIN_SEARCH_LENGTH;
    const suggestions = useMemo(
        () => (canSearch ? filterNetworkLocations(trimmedQuery) : []),
        [trimmedQuery, canSearch]
    );
    const showDropdown = isOpen && canSearch && suggestions.length > 0;

    useEffect(() => {
        setQuery(value?.location || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectNetworkLocation = (entry) => {
        onChange({
            type: 'network',
            location: entry.location,
            routeId: entry.routeId,
            routeName: entry.routeName,
        });
        setQuery(entry.location);
        setIsOpen(false);
    };

    const handleInputChange = (event) => {
        const nextQuery = event.target.value;
        setQuery(nextQuery);

        const normalized = nextQuery.trim();
        const exactMatch = DELIVERY_NETWORK_LOCATIONS.find(
            (entry) => entry.location.toLowerCase() === normalized.toLowerCase()
        );

        if (exactMatch) {
            setIsOpen(normalized.length >= MIN_SEARCH_LENGTH);
            onChange({
                type: 'network',
                location: exactMatch.location,
                routeId: exactMatch.routeId,
                routeName: exactMatch.routeName,
            });
            return;
        }

        setIsOpen(normalized.length >= MIN_SEARCH_LENGTH);
        onChange({
            type: 'custom',
            location: normalized,
            routeId: null,
            routeName: null,
        });
    };

    const handleFocus = () => {
        if (canSearch && suggestions.length > 0) {
            setIsOpen(true);
        }
    };

    const isNetworkLocation = value?.type === 'network';

    return (
        <div ref={containerRef} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                Delivery Location
            </label>
            <input
                type="text"
                required
                value={query}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder="Type at least 3 letters to search..."
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-[#b82063] transition-all placeholder:text-white/50"
                autoComplete="off"
            />

            {showDropdown && (
                <div className="rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    {suggestions.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => selectNetworkLocation(entry)}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                        >
                            <p className="text-sm font-bold text-white">{entry.location}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{entry.routeName}</p>
                        </button>
                    ))}
                </div>
            )}

            {isNetworkLocation && value?.routeName && (
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                    {value.routeName} · Flat rate delivery
                </p>
            )}
        </div>
    );
};

export default DeliveryLocationPicker;

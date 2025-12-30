import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, labelKey = 'nome', valueKey = 'id' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));

    const filteredOptions = options.filter(opt =>
        String(opt[labelKey]).toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="smart-select-container" ref={containerRef}>
            <div
                className="smart-select-input-wrapper"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Search size={16} className="search-icon" />
                <input
                    type="text"
                    id={`search-select-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
                    name={`search-select-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
                    placeholder={selectedOption ? selectedOption[labelKey] : placeholder}
                    value={isOpen ? search : (selectedOption ? selectedOption[labelKey] : '')}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    readOnly={!isOpen}
                    style={{ cursor: 'pointer' }}
                />
                <div style={{ position: 'absolute', right: '1rem', color: 'var(--text-muted)' }}>
                    <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div className="smart-select-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt[valueKey]}
                                className={`smart-select-item ${String(opt[valueKey]) === String(value) ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{opt[labelKey]}</span>
                                    {String(opt[valueKey]) === String(value) && <Check size={14} />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="smart-select-no-results">Nenhum resultado encontrado</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;

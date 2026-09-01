import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, ChevronDown, Check, Building2, PlusCircle } from 'lucide-react';
import { CATEGORIZED_COLLEGES, CollegeItem } from '../../constants/colleges';

interface CollegeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

const CATEGORIES: Array<CollegeItem['category']> = [
  'POPULAR',
  'ALL COLLEGES (A-Z)',
];

export const CollegeCombobox: React.FC<CollegeComboboxProps> = ({
  value,
  onChange,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customCollege, setCustomCollege] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const searchInputId = useId();
  const customInputId = useId();

  // Determine initial state if value exists
  useEffect(() => {
    if (!value) return;

    const matchedKnown = CATEGORIZED_COLLEGES.find(
      (c) => c.name === value || `${c.name}, ${c.city}` === value
    );

    if (matchedKnown) {
      setIsOtherSelected(false);
    } else if (value && value !== 'Other') {
      setIsOtherSelected(true);
      setCustomCollege(value);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelectCollege = (collegeName: string) => {
    if (collegeName === 'Other') {
      setIsOtherSelected(true);
      onChange(customCollege || '');
      setIsOpen(false);
      setTimeout(() => customInputRef.current?.focus(), 100);
      return;
    }

    setIsOtherSelected(false);
    setCustomCollege('');
    onChange(collegeName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomCollege(val);
    onChange(val);
  };

  // Filter colleges based on search query
  const query = searchQuery.trim().toLowerCase();
  const filteredColleges = CATEGORIZED_COLLEGES.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      (c.shortName && c.shortName.toLowerCase().includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query))
  );

  // Function to highlight matching text substring
  const highlightMatch = (text: string) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-[#E01B22]/30 text-[#FF2A2A] font-bold px-0.5 rounded-[1px]">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const displayLabel = isOtherSelected
    ? customCollege || 'Other College'
    : value || 'Search or select your college...';

  return (
    <div className={`relative space-y-2 ${className}`} ref={containerRef}>
      {/* Combobox Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
          if (e.key === 'Escape') setIsOpen(false);
        }}
        className={`w-full bg-[#0A0607] border ${
          error ? 'border-[#E01B22]' : isOpen ? 'border-[#E01B22]' : 'border-[#2A1A1D]'
        } text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono text-xs cursor-pointer flex items-center justify-between transition-colors hover:border-[#E01B22]/60 select-none`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
          <Building2 className={`w-4 h-4 shrink-0 ${value ? 'text-[#E01B22]' : 'text-[#6B5A5C]'}`} />
          <span className={`truncate ${value ? 'text-[#F7F2F2] font-semibold' : 'text-[#6B5A5C]'}`}>
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[#A79798] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#E01B22]' : ''
          }`}
        />
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-[#0D0809] border border-[#2A1A1D] rounded-[2px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-[#2A1A1D] bg-[#130C0E] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#E01B22] shrink-0" />
            <input
              id={searchInputId}
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search college or city..."
              className="w-full bg-transparent text-[#F7F2F2] text-xs font-mono outline-none placeholder:text-[#6B5A5C]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-mono text-[#A79798] hover:text-[#E01B22] px-1"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* College List Options Container (Max Height 280px) */}
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
            {filteredColleges.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-[#A79798]">
                <p>No matching colleges found.</p>
                <button
                  type="button"
                  onClick={() => handleSelectCollege('Other')}
                  className="mt-2 text-[#E01B22] hover:underline font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Select "Other" to enter college name
                </button>
              </div>
            ) : (
              <>
                {CATEGORIES.map((cat) => {
                  const catItems = filteredColleges.filter((c) => c.category === cat);
                  if (catItems.length === 0) return null;

                  return (
                    <div key={cat} className="border-b border-[#2A1A1D] last:border-b-0">
                      {/* Category Header */}
                      <div className="text-[10px] font-mono text-[#E01B22] font-bold tracking-widest px-3 py-1.5 bg-[#130C0E]/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between border-y border-[#2A1A1D]/40">
                        <span>{cat}</span>
                        <span className="text-[9px] text-[#6B5A5C] font-normal">{catItems.length}</span>
                      </div>

                      {/* Category College Items */}
                      <div>
                        {catItems.map((college) => {
                          const fullName = college.name;
                          const isSelected = value === fullName || value === `${college.name}, ${college.city}`;

                          return (
                            <div
                              key={college.id}
                              onClick={() => handleSelectCollege(fullName)}
                              className={`px-3 py-2 text-xs font-mono cursor-pointer flex items-center justify-between transition-colors hover:bg-[#E01B22]/15 border-b border-[#2A1A1D]/20 last:border-b-0 ${
                                isSelected ? 'bg-[#E01B22]/20 text-[#F7F2F2] font-semibold' : 'text-[#A79798] hover:text-[#F7F2F2]'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="truncate text-xs font-semibold text-[#F7F2F2]">
                                  {highlightMatch(college.name)}
                                  {college.shortName && (
                                    <span className="ml-1.5 text-[10px] text-[#E08A17] font-normal">
                                      ({highlightMatch(college.shortName)})
                                    </span>
                                  )}
                                </div>
                                {college.city && (
                                  <div className="text-[10px] text-[#6B5A5C] truncate">
                                    {highlightMatch(college.city)}
                                  </div>
                                )}
                              </div>

                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E01B22] shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Other Option at the bottom */}
                <div
                  onClick={() => handleSelectCollege('Other')}
                  className={`px-3 py-2.5 text-xs font-mono cursor-pointer flex items-center gap-2 transition-colors hover:bg-[#E01B22]/20 bg-[#130C0E] border-t border-[#2A1A1D] ${
                    isOtherSelected ? 'text-[#E01B22] font-bold' : 'text-[#A79798] hover:text-[#F7F2F2]'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#E01B22]" />
                  <span className="font-semibold">+ Other / Not Listed Above</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Input for "Other" Selection */}
      {isOtherSelected && (
        <div className="mt-2 animate-in fade-in duration-200">
          <label htmlFor={customInputId} className="block text-[11px] font-mono text-[#E08A17] font-bold mb-1 tracking-wider uppercase">
            ENTER YOUR COLLEGE NAME *
          </label>
          <input
            id={customInputId}
            ref={customInputRef}
            type="text"
            value={customCollege}
            onChange={handleCustomChange}
            placeholder="Type full official college & campus name..."
            className={`w-full bg-[#0A0607] border ${
              error ? 'border-[#E01B22]' : 'border-[#E08A17]'
            } text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono text-xs focus:ring-1 focus:ring-[#E08A17]`}
          />
        </div>
      )}

      {error && <p className="text-[11px] font-mono text-[#E01B22] mt-1">{error}</p>}
    </div>
  );
};

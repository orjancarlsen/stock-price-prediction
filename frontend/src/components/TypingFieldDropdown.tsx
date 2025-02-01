import React, {
    useState,
    useRef,
    useEffect,
    ChangeEvent,
    KeyboardEvent,
    TransitionEvent,
  } from 'react';
  import { Company } from '../types';
  import SearchIcon from '@assets/search.svg';
  
  interface DropdownProps {
    options: Company[];
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    expanded: boolean; // Determines whether the field is expanded (active) or not
    onClose?: () => void;
  }
  
  const TypingFieldDropdown: React.FC<DropdownProps> = ({
    options,
    onChange,
    placeholder,
    expanded,
    onClose,
  }) => {
    const [filterText, setFilterText] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [transitionComplete, setTransitionComplete] = useState<boolean>(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Ref for the scrollable dropdown container
    const dropdownScrollRef = useRef<HTMLDivElement>(null);
  
    // When expanded becomes true, focus the input and open the dropdown.
    useEffect(() => {
      if (expanded) {
        inputRef.current?.focus();
        setIsDropdownOpen(true);
      } else {
        setIsDropdownOpen(false);
        setFilterText('');
        setTransitionComplete(false);
      }
    }, [expanded]);
  
    // Update transitionComplete state when container finishes width transition
    const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName === 'width') {
        setTransitionComplete(expanded);
      }
    };
  
    // Filter options (case-insensitive)
    const filteredOptions = options.filter((option) =>
      (option.name &&
        option.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (option.symbol &&
        option.symbol.toLowerCase().includes(filterText.toLowerCase()))
    );
  
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      setFilterText(e.target.value);
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
      }
      setHighlightedIndex(-1);
      onChange(e);
    };
  
    const handleOptionClick = (option: Company) => {
      const value = option.name
        ? `${option.name} (${option.symbol})`
        : option.symbol;
      setFilterText(value);
      onChange({ target: { value: option.symbol } } as ChangeEvent<HTMLInputElement>);
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    };
  
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isDropdownOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        handleOptionClick(filteredOptions[highlightedIndex]);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        if (onClose) onClose();
      }
    };
  
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        if (onClose) onClose();
      }
    };
  
    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    // Ensure the highlighted item is scrolled into view
    useEffect(() => {
      if (highlightedIndex < 0 || !dropdownScrollRef.current) return;
      const container = dropdownScrollRef.current;
      const highlightedItem = container.querySelector(
        `li[data-index="${highlightedIndex}"]`
      ) as HTMLElement | null;
      if (highlightedItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const itemTop = highlightedItem.offsetTop;
        const itemBottom = itemTop + highlightedItem.offsetHeight;
        if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.clientHeight;
        } else if (itemTop < containerTop) {
          container.scrollTop = itemTop;
        }
      }
    }, [highlightedIndex]);
  
    return (
      <div
        ref={containerRef}
        onTransitionEnd={handleTransitionEnd}
        style={{
          ...containerStyle,
          width: expanded ? '300px' : '20px',
        }}
      >
        {/* Always show the search icon on the left */}
        <SearchIcon style={searchIconStyle} />
        {expanded && (
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={filterText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />
        )}
        {expanded && isDropdownOpen && transitionComplete && (
          <div style={dropdownWrapperStyle}>
            <div ref={dropdownScrollRef} style={dropdownScrollStyle}>
              <ul style={dropdownStyle}>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <li
                      key={index}
                      data-index={index}
                      onClick={() => handleOptionClick(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor:
                          highlightedIndex === index ? '#e0e0e0' : 'white',
                        borderBottom:
                          index < filteredOptions.length - 1
                            ? '1px solid #f0f0f0'
                            : 'none',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {option.name} ({option.symbol})
                    </li>
                  ))
                ) : (
                  <li style={{ padding: '8px 12px', color: '#999' }}>
                    No options found
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Simplified Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '0.5rem 1rem',
    transition: 'width 300ms ease',
    overflow: 'visible',
  };
  
  const searchIconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    flexShrink: 0,
  };
  
  const inputStyle: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontSize: '1rem',
    backgroundColor: 'transparent',
    marginLeft: '0.5rem',
  };
  
  const dropdownWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    borderRadius: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    background: 'white',
    overflow: 'hidden',
  };
  
  const dropdownScrollStyle: React.CSSProperties = {
    maxHeight: '200px',
    overflowY: 'auto',
  };
  
  const dropdownStyle: React.CSSProperties = {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  };
  
  export default TypingFieldDropdown;
  
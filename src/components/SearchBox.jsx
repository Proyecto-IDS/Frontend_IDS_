import { useState } from 'react';
import PropTypes from 'prop-types';

function SearchBox({
  defaultValue = '',
  placeholder = 'Buscar incidentes',
  onSearch,
  autoFocus = false,
  inputId = 'search-box',
}) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.(value.trim());
  };

  return (
    <form className="search-box" role="search" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        Buscar
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <button type="submit" className="btn primary">
        Buscar
      </button>
    </form>
  );
}

SearchBox.propTypes = {
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string,
  onSearch: PropTypes.func,
  autoFocus: PropTypes.bool,
  inputId: PropTypes.string,
};

export default SearchBox;

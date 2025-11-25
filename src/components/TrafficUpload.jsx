import { useState } from 'react';
import PropTypes from 'prop-types';
import './TrafficUpload.css';

export function TrafficUpload({ onUploadSuccess, onUploadError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.json', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        onUploadError?.('Por favor selecciona un archivo JSON o CSV');
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = ['.json', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        onUploadError?.('Por favor selecciona un archivo JSON o CSV');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);

    try {
      const { uploadTrafficFile } = await import('../app/api.js');
      const result = await uploadTrafficFile(selectedFile);
      
      setSelectedFile(null);
      onUploadSuccess?.(result);
    } catch (error) {
      onUploadError?.(error.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
  };

  return (
    <div className="traffic-upload">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="traffic-file-input"
          className="file-input"
          accept=".json,.csv"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        
        {selectedFile === null ? (
          <label htmlFor="traffic-file-input" className="upload-label">
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="upload-text">
              <strong>Haz clic para seleccionar</strong>{' '}
              o arrastra un archivo aquí
            </span>
            <span className="upload-hint">JSON o CSV (máx. 10MB)</span>
          </label>
        ) : (
          <div className="file-selected">
            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            {isUploading ? null : (
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                title="Eliminar archivo"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={Boolean(selectedFile) === false || isUploading}
        >
          {isUploading ? (
            <>
              <span className="spinner" />{' '}
              Analizando...
            </>
          ) : (
            <>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Subir y Analizar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default TrafficUpload;

TrafficUpload.propTypes = {
  onUploadSuccess: PropTypes.func,
  onUploadError: PropTypes.func,
};

import React, { useState, useCallback } from 'react';

const FileUpload = ({ onFileUpload, isLoading = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const allowedTypes = ['csv', 'json', 'xml', 'txt'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    const errors = [];
    
    if (!file) {
      errors.push('No se seleccionó ningún archivo');
      return errors;
    }

    // Validar tipo de archivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`Tipo de archivo no permitido. Formatos soportados: ${allowedTypes.join(', ')}`);
    }

    // Validar tamaño
    if (file.size > maxSize) {
      errors.push(`El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`);
    }

    return errors;
  };

  const handleFileSelect = async (file) => {
    const errors = validateFile(file);
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();
      
      if (result.success) {
        onFileUpload(result);
      } else {
        throw new Error(result.error || 'Error al subir archivo');
      }

    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert(`Error al subir archivo: ${error.message}`);
    } finally {
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        📁 Subir Archivo para Validación
      </h2>
      
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input').click()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="loading-spinner w-8 h-8 mb-4"></div>
            <p className="text-gray-600">Procesando archivo...</p>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1 text-center">{uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Arrastra tu archivo aquí
            </h3>
            <p className="text-gray-500 mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {allowedTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  .{type}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Tamaño máximo: {maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept={allowedTypes.map(type => `.${type}`).join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Información</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Se validará la estructura y contenido del archivo</li>
          <li>• Los errores detectados se mostrarán automáticamente</li>
          <li>• Podrás corregir el archivo usando IA local (Ollama)</li>
          <li>• Se guardará un historial para mejorar futuras correcciones</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
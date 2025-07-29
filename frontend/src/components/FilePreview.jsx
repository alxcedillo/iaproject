import React, { useState } from 'react';

const FilePreview = ({ fileData, title = "Vista Previa" }) => {
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' o 'raw'

  if (!fileData) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-500">No hay archivo para mostrar</p>
        </div>
      </div>
    );
  }

  const { file, content, processed, validation } = fileData;

  // Componente para renderizar JSON como árbol
  const JsonTree = ({ data, depth = 0 }) => {
    const renderValue = (key, value, isLast = true) => {
      const indent = '  '.repeat(depth);
      const comma = isLast ? '' : ',';

      if (value === null) {
        return (
          <div className="json-tree">
            <span className="json-key">"{key}"</span>: <span className="json-null">null</span>{comma}
          </div>
        );
      }

      if (typeof value === 'string') {
        return (
          <div className="json-tree">
            <span className="json-key">"{key}"</span>: <span className="json-string">"{value}"</span>{comma}
          </div>
        );
      }

      if (typeof value === 'number') {
        return (
          <div className="json-tree">
            <span className="json-key">"{key}"</span>: <span className="json-number">{value}</span>{comma}
          </div>
        );
      }

      if (typeof value === 'boolean') {
        return (
          <div className="json-tree">
            <span className="json-key">"{key}"</span>: <span className="json-boolean">{value.toString()}</span>{comma}
          </div>
        );
      }

      if (Array.isArray(value)) {
        return (
          <div className="json-tree">
            <span className="json-key">"{key}"</span>: [
            <div style={{ marginLeft: '20px' }}>
              {value.map((item, index) => (
                <JsonTree key={index} data={{ [index]: item }} depth={depth + 1} />
              ))}
            </div>
            ]{comma}
          </div>
        );
      }

      if (typeof value === 'object') {
        return (
          <div className="json-tree">
            <span className="json-key">"{key}"</span>: {'{'}
            <div style={{ marginLeft: '20px' }}>
              <JsonTree data={value} depth={depth + 1} />
            </div>
            {'}'}{comma}
          </div>
        );
      }

      return (
        <div className="json-tree">
          <span className="json-key">"{key}"</span>: {value?.toString()}{comma}
        </div>
      );
    };

    if (!data || typeof data !== 'object') return null;

    const entries = Object.entries(data);
    return entries.map(([key, value], index) => 
      renderValue(key, value, index === entries.length - 1)
    );
  };

  // Componente para renderizar CSV como tabla
  const CsvTable = ({ data }) => {
    if (!Array.isArray(data) || data.length === 0) {
      return <p className="text-gray-500">No hay datos CSV para mostrar</p>;
    }

    const headers = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 50).map((row, rowIndex) => ( // Limitar a 50 filas para performance
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[header] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 50 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Mostrando las primeras 50 filas de {data.length} total
          </p>
        )}
      </div>
    );
  };

  // Renderizar contenido según el tipo
  const renderContent = () => {
    if (viewMode === 'raw') {
      return (
        <div className="code-block">
          <pre className="whitespace-pre-wrap break-words">{content}</pre>
        </div>
      );
    }

    switch (file.type) {
      case 'json':
        if (processed) {
          return (
            <div className="bg-gray-50 p-4 rounded-lg">
              <JsonTree data={processed} />
            </div>
          );
        } else {
          return (
            <div className="code-block">
              <pre className="whitespace-pre-wrap break-words">{content}</pre>
            </div>
          );
        }

      case 'csv':
        if (processed && Array.isArray(processed)) {
          return <CsvTable data={processed} />;
        } else {
          return (
            <div className="code-block">
              <pre className="whitespace-pre-wrap break-words">{content}</pre>
            </div>
          );
        }

      case 'xml':
        return (
          <div className="code-block">
            <pre className="whitespace-pre-wrap break-words">{content}</pre>
          </div>
        );

      default:
        return (
          <div className="code-block">
            <pre className="whitespace-pre-wrap break-words">{content}</pre>
          </div>
        );
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('formatted')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'formatted'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Formateado
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'raw'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Código
            </button>
          </div>
        </div>
      </div>

      {/* Información del archivo */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-600">Archivo:</span>
            <p className="text-gray-800">{file.originalName}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Tipo:</span>
            <p className="text-gray-800 uppercase">{file.type}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Tamaño:</span>
            <p className="text-gray-800">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Estado:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              validation.isValid 
                ? 'bg-success-100 text-success-800' 
                : 'bg-error-100 text-error-800'
            }`}>
              {validation.isValid ? '✅ Válido' : '❌ Errores detectados'}
            </span>
          </div>
        </div>
      </div>

      {/* Errores de validación */}
      {validation.errors && validation.errors.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-error-800 mb-3">⚠️ Errores Detectados</h4>
          <div className="space-y-2">
            {validation.errors.map((error, index) => (
              <div key={index} className="error-item">
                <div className="text-error-600 mr-3">•</div>
                <p className="text-error-700">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido del archivo */}
      <div className="scrollbar-thin max-h-96 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Estadísticas adicionales */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Líneas: {content.split('\n').length}</span>
          <span>Caracteres: {content.length}</span>
          {file.type === 'csv' && processed && (
            <span>Filas: {processed.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
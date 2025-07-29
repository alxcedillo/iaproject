import React, { useState } from 'react';

const FileComparator = ({ originalFile, correctedResult }) => {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' o 'unified'

  if (!originalFile || !correctedResult) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500">
            Sube un archivo y córrigelo para ver la comparación
          </p>
        </div>
      </div>
    );
  }

  const { content: originalContent } = originalFile;
  const { correctedContent, explanation } = correctedResult;

  // Función para destacar diferencias simples
  const highlightDifferences = (text1, text2) => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    
    const highlighted1 = [];
    const highlighted2 = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 !== line2) {
        highlighted1.push({ line: line1, changed: true, lineNumber: i + 1 });
        highlighted2.push({ line: line2, changed: true, lineNumber: i + 1 });
      } else {
        highlighted1.push({ line: line1, changed: false, lineNumber: i + 1 });
        highlighted2.push({ line: line2, changed: false, lineNumber: i + 1 });
      }
    }

    return { highlighted1, highlighted2 };
  };

  const { highlighted1, highlighted2 } = highlightDifferences(originalContent, correctedContent);

  // Componente para renderizar líneas con resaltado
  const CodeLine = ({ lineData, type }) => {
    const { line, changed, lineNumber } = lineData;
    
    return (
      <div
        className={`flex ${
          changed
            ? type === 'original'
              ? 'bg-error-50 border-l-4 border-error-400'
              : 'bg-success-50 border-l-4 border-success-400'
            : 'bg-white'
        }`}
      >
        <span className="text-gray-400 text-xs w-8 flex-shrink-0 text-right pr-2 py-1">
          {lineNumber}
        </span>
        <pre className="flex-1 py-1 px-2 text-sm font-mono whitespace-pre-wrap break-words">
          {line || ' '}
        </pre>
      </div>
    );
  };

  // Vista lado a lado
  const SideBySideView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Archivo Original */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">📄 Archivo Original</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-error-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Líneas modificadas</span>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-thin">
          {highlighted1.map((lineData, index) => (
            <CodeLine key={index} lineData={lineData} type="original" />
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {originalContent.split('\n').length} líneas
        </div>
      </div>

      {/* Archivo Corregido */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">✅ Archivo Corregido</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Líneas corregidas</span>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-thin">
          {highlighted2.map((lineData, index) => (
            <CodeLine key={index} lineData={lineData} type="corrected" />
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {correctedContent.split('\n').length} líneas
        </div>
      </div>
    </div>
  );

  // Vista unificada
  const UnifiedView = () => (
    <div>
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">📊 Vista Unificada</h4>
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-error-100 border border-error-400 rounded"></div>
            <span>Eliminado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-success-100 border border-success-400 rounded"></div>
            <span>Agregado</span>
          </div>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-thin">
        {highlighted1.map((originalLine, index) => {
          const correctedLine = highlighted2[index];
          
          if (originalLine.changed) {
            return (
              <div key={`unified-${index}`}>
                {/* Línea eliminada */}
                <div className="flex bg-error-50 border-l-4 border-error-400">
                  <span className="text-error-600 text-xs w-4 flex-shrink-0 text-center py-1">-</span>
                  <span className="text-gray-400 text-xs w-8 flex-shrink-0 text-right pr-2 py-1">
                    {originalLine.lineNumber}
                  </span>
                  <pre className="flex-1 py-1 px-2 text-sm font-mono whitespace-pre-wrap break-words">
                    {originalLine.line || ' '}
                  </pre>
                </div>
                
                {/* Línea agregada */}
                <div className="flex bg-success-50 border-l-4 border-success-400">
                  <span className="text-success-600 text-xs w-4 flex-shrink-0 text-center py-1">+</span>
                  <span className="text-gray-400 text-xs w-8 flex-shrink-0 text-right pr-2 py-1">
                    {correctedLine.lineNumber}
                  </span>
                  <pre className="flex-1 py-1 px-2 text-sm font-mono whitespace-pre-wrap break-words">
                    {correctedLine.line || ' '}
                  </pre>
                </div>
              </div>
            );
          } else {
            return (
              <div key={`unified-${index}`} className="flex bg-white">
                <span className="text-gray-400 text-xs w-4 flex-shrink-0 text-center py-1"> </span>
                <span className="text-gray-400 text-xs w-8 flex-shrink-0 text-right pr-2 py-1">
                  {originalLine.lineNumber}
                </span>
                <pre className="flex-1 py-1 px-2 text-sm font-mono whitespace-pre-wrap break-words">
                  {originalLine.line || ' '}
                </pre>
              </div>
            );
          }
        })}
      </div>
    </div>
  );

  // Calcular estadísticas de cambios
  const changedLines = highlighted1.filter(line => line.changed).length;
  const totalLines = highlighted1.length;
  const changePercentage = totalLines > 0 ? ((changedLines / totalLines) * 100).toFixed(1) : 0;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">🔍 Comparación de Archivos</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Lado a lado
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              viewMode === 'unified'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Unificado
          </button>
        </div>
      </div>

      {/* Estadísticas de cambios */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{changedLines}</div>
            <div className="text-sm text-gray-600">Líneas modificadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{changePercentage}%</div>
            <div className="text-sm text-gray-600">Porcentaje de cambios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalLines}</div>
            <div className="text-sm text-gray-600">Total de líneas</div>
          </div>
        </div>
      </div>

      {/* Explicación de la IA */}
      {explanation && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">🤖 Explicación de la IA</h4>
          <p className="text-yellow-700 text-sm">{explanation}</p>
        </div>
      )}

      {/* Vista de comparación */}
      {viewMode === 'side-by-side' ? <SideBySideView /> : <UnifiedView />}

      {/* Acciones */}
      <div className="mt-6 flex justify-center space-x-4">
        <button
          onClick={() => {
            navigator.clipboard.writeText(correctedContent);
            alert('Contenido corregido copiado al portapapeles');
          }}
          className="btn-primary"
        >
          📋 Copiar corregido
        </button>
        
        <button
          onClick={() => {
            const blob = new Blob([correctedContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `corregido-${originalFile.file.originalName}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="btn-success"
        >
          💾 Descargar corregido
        </button>
      </div>
    </div>
  );
};

export default FileComparator;
import React, { useState } from 'react';
import './index.css';

// Importar componentes
import FileUpload from './components/FileUpload';
import FilePreview from './components/FilePreview';
import FileComparator from './components/FileComparator';
import StatusBar from './components/StatusBar';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [correctedResult, setCorrectedResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Manejar subida de archivo
  const handleFileUpload = (fileData) => {
    setCurrentFile(fileData);
    setCorrectedResult(null); // Limpiar resultado anterior
  };

  // Manejar corrección con IA
  const handleCorrectFile = async () => {
    if (!currentFile) return;

    setIsCorrecting(true);
    
    try {
      const response = await fetch('/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentFile.content,
          fileType: currentFile.file.type,
          errors: currentFile.validation.errors,
          filename: currentFile.file.originalName,
        }),
      });

      const result = await response.json();
      setCorrectedResult(result);

      if (!result.success) {
        alert(`Error en la corrección: ${result.error}`);
      }

    } catch (error) {
      console.error('Error al corregir archivo:', error);
      alert(`Error al corregir archivo: ${error.message}`);
    } finally {
      setIsCorrecting(false);
    }
  };

  // Limpiar todo
  const handleClear = () => {
    setCurrentFile(null);
    setCorrectedResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-3xl mr-3">🤖</div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">
                  Validador de Archivos con IA
                </h1>
                <p className="text-gray-600 mt-1">
                  Valida, corrige y optimiza tus archivos usando inteligencia artificial local
                </p>
              </div>
            </div>
            
            {currentFile && (
              <div className="flex space-x-3">
                {!correctedResult && currentFile.validation.errors.length > 0 && (
                  <button
                    onClick={handleCorrectFile}
                    disabled={isCorrecting}
                    className="btn-primary"
                  >
                    {isCorrecting ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2"></div>
                        Corrigiendo...
                      </>
                    ) : (
                      <>🔧 Corregir con IA</>
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleClear}
                  className="btn-secondary"
                >
                  🗑️ Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Paso 1: Subir archivo */}
          <section>
            <FileUpload 
              onFileUpload={handleFileUpload}
              isLoading={isUploading}
            />
          </section>

          {/* Paso 2: Vista previa del archivo original */}
          {currentFile && (
            <section className="animate-fade-in">
              <FilePreview 
                fileData={currentFile}
                title="📄 Archivo Original"
              />
              
              {/* Botón de corrección dentro de la vista previa si hay errores */}
              {currentFile.validation.errors.length > 0 && !correctedResult && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleCorrectFile}
                    disabled={isCorrecting}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    {isCorrecting ? (
                      <>
                        <div className="loading-spinner w-5 h-5 mr-3"></div>
                        🤖 Procesando con IA...
                      </>
                    ) : (
                      <>🔧 Corregir errores con IA</>
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    Se detectaron {currentFile.validation.errors.length} error(es) que pueden ser corregidos
                  </p>
                </div>
              )}

              {/* Mensaje si no hay errores */}
              {currentFile.validation.errors.length === 0 && (
                <div className="mt-6 text-center">
                  <div className="success-item inline-flex">
                    <div className="text-success-600 mr-3">✅</div>
                    <p className="text-success-700 font-medium">
                      ¡Excelente! El archivo no tiene errores detectados
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Paso 3: Resultado de la corrección */}
          {correctedResult && (
            <section className="animate-slide-up">
              {correctedResult.success ? (
                <div className="space-y-6">
                  {/* Mensaje de éxito */}
                  <div className="success-item">
                    <div className="text-success-600 mr-3">🎉</div>
                    <div>
                      <p className="text-success-700 font-medium">
                        ¡Archivo corregido exitosamente!
                      </p>
                      <p className="text-success-600 text-sm mt-1">
                        {correctedResult.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Vista previa del archivo corregido */}
                  <FilePreview 
                    fileData={{
                      file: { ...currentFile.file, originalName: `corregido-${currentFile.file.originalName}` },
                      content: correctedResult.correctedContent,
                      processed: null, // Se procesará automáticamente
                      validation: { isValid: true, errors: [] }
                    }}
                    title="✅ Archivo Corregido"
                  />

                  {/* Comparador */}
                  <FileComparator 
                    originalFile={currentFile}
                    correctedResult={correctedResult}
                  />
                </div>
              ) : (
                // Error en la corrección
                <div className="error-item">
                  <div className="text-error-600 mr-3">❌</div>
                  <div>
                    <p className="text-error-700 font-medium">
                      Error al corregir el archivo
                    </p>
                    <p className="text-error-600 text-sm mt-1">
                      {correctedResult.error}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Información del sistema y ayuda */}
          {!currentFile && (
            <section className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <div className="text-6xl mb-6">🚀</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Validación Inteligente de Archivos
                </h2>
                <p className="text-gray-600 mb-8">
                  Sube tus archivos CSV, JSON, XML o TXT y nuestro sistema los validará automáticamente.
                  Si encuentra errores, usará IA local para corregirlos y mejorar la calidad de tus datos.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="text-2xl mb-3">📤</div>
                    <h3 className="font-semibold text-blue-800 mb-2">1. Sube tu archivo</h3>
                    <p className="text-blue-700 text-sm">
                      Arrastra o selecciona archivos CSV, JSON, XML o TXT de hasta 10MB
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <div className="text-2xl mb-3">🔍</div>
                    <h3 className="font-semibold text-purple-800 mb-2">2. Validación automática</h3>
                    <p className="text-purple-700 text-sm">
                      El sistema detecta errores de sintaxis, estructura y formato
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="text-2xl mb-3">🤖</div>
                    <h3 className="font-semibold text-green-800 mb-2">3. Corrección con IA</h3>
                    <p className="text-green-700 text-sm">
                      Ollama (local) corrige los errores y mejora la calidad del archivo
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer con StatusBar */}
      <StatusBar />
    </div>
  );
}

export default App;
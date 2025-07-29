import React, { useState, useEffect } from 'react';

const StatusBar = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    fetchHistory();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchHistory();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/models');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error al obtener estado del sistema:', error);
      setSystemStatus({ available: false, error: error.message });
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/history');
      const data = await response.json();
      setHistory(data.statistics);
    } catch (error) {
      console.error('Error al obtener historial:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center">
          <div className="loading-spinner w-4 h-4 mr-2"></div>
          <span className="text-sm text-gray-600">Cargando estado del sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between text-sm">
        {/* Estado de Ollama */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                systemStatus?.available ? 'bg-success-500' : 'bg-error-500'
              }`}
            ></div>
            <span className="text-gray-600">
              Ollama: {systemStatus?.available ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {systemStatus?.currentModel && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Modelo:</span>
              <span className="font-medium text-gray-800">{systemStatus.currentModel}</span>
            </div>
          )}

          {systemStatus?.models && systemStatus.models.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Modelos disponibles:</span>
              <span className="font-medium text-blue-600">{systemStatus.models.length}</span>
            </div>
          )}
        </div>

        {/* Estadísticas del historial */}
        {history && (
          <div className="flex items-center space-x-6 mt-2 sm:mt-0">
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Archivos procesados:</span>
              <span className="font-medium text-blue-600">{history.totalFiles || 0}</span>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Correcciones realizadas:</span>
              <span className="font-medium text-green-600">{history.totalCorrections || 0}</span>
            </div>

            {history.fileTypes && Object.keys(history.fileTypes).length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-600">Tipos soportados:</span>
                <div className="flex space-x-1">
                  {Object.entries(history.fileTypes).map(([type, count]) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                      title={`${count} archivos procesados`}
                    >
                      .{type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerta si Ollama no está disponible */}
      {systemStatus && !systemStatus.available && (
        <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-warning-600 mr-3">⚠️</div>
            <div>
              <p className="text-warning-800 font-medium">Ollama no está disponible</p>
              <p className="text-warning-700 text-sm">
                Asegúrate de que Ollama esté ejecutándose en http://localhost:11434. 
                Las funciones de corrección con IA estarán deshabilitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips de uso si no hay historial */}
      {history && history.totalFiles === 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">💡</div>
            <div>
              <p className="text-blue-800 font-medium">¡Bienvenido al Validador de Archivos con IA!</p>
              <p className="text-blue-700 text-sm">
                Sube tu primer archivo para comenzar. El sistema aprenderá de cada corrección para mejorar futuras validaciones.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
const fs = require('fs-extra');
const path = require('path');

class HistoryManager {
  constructor(historyFilePath = './data/history.json') {
    this.historyFilePath = historyFilePath;
    this.ensureHistoryFile();
  }

  // Asegurar que el archivo de historial existe
  async ensureHistoryFile() {
    try {
      await fs.ensureDir(path.dirname(this.historyFilePath));
      
      if (!await fs.pathExists(this.historyFilePath)) {
        const initialData = {
          corrections: [],
          commonErrors: {},
          statistics: {
            totalFiles: 0,
            totalCorrections: 0,
            fileTypes: {}
          }
        };
        await fs.writeJson(this.historyFilePath, initialData, { spaces: 2 });
      }
    } catch (error) {
      console.error('Error al inicializar archivo de historial:', error);
    }
  }

  // Obtener historial completo
  async getHistory() {
    try {
      return await fs.readJson(this.historyFilePath);
    } catch (error) {
      console.error('Error al leer historial:', error);
      return {
        corrections: [],
        commonErrors: {},
        statistics: {
          totalFiles: 0,
          totalCorrections: 0,
          fileTypes: {}
        }
      };
    }
  }

  // Agregar una nueva corrección al historial
  async addCorrection(originalContent, correctedContent, fileType, errors, aiExplanation) {
    try {
      const history = await this.getHistory();
      
      const correction = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        fileType: fileType,
        originalLength: originalContent.length,
        correctedLength: correctedContent.length,
        errors: errors,
        aiExplanation: aiExplanation,
        // Solo guardar fragmentos para no ocupar mucho espacio
        originalSample: originalContent.substring(0, 500),
        correctedSample: correctedContent.substring(0, 500)
      };

      history.corrections.push(correction);
      
      // Actualizar errores comunes
      errors.forEach(error => {
        if (!history.commonErrors[fileType]) {
          history.commonErrors[fileType] = {};
        }
        
        const errorKey = error.substring(0, 100); // Limitar longitud de clave
        history.commonErrors[fileType][errorKey] = 
          (history.commonErrors[fileType][errorKey] || 0) + 1;
      });

      // Actualizar estadísticas
      history.statistics.totalFiles += 1;
      history.statistics.totalCorrections += errors.length;
      history.statistics.fileTypes[fileType] = 
        (history.statistics.fileTypes[fileType] || 0) + 1;

      // Mantener solo las últimas 100 correcciones para no crecer indefinidamente
      if (history.corrections.length > 100) {
        history.corrections = history.corrections.slice(-100);
      }

      await fs.writeJson(this.historyFilePath, history, { spaces: 2 });
      return correction.id;
    } catch (error) {
      console.error('Error al agregar corrección al historial:', error);
      return null;
    }
  }

  // Obtener errores comunes para un tipo de archivo específico
  async getCommonErrors(fileType) {
    try {
      const history = await this.getHistory();
      return history.commonErrors[fileType] || {};
    } catch (error) {
      console.error('Error al obtener errores comunes:', error);
      return {};
    }
  }

  // Obtener contexto relevante para el prompt de IA
  async getContextForPrompt(fileType, maxEntries = 5) {
    try {
      const history = await this.getHistory();
      
      // Obtener correcciones recientes del mismo tipo de archivo
      const relevantCorrections = history.corrections
        .filter(c => c.fileType === fileType)
        .slice(-maxEntries);

      // Obtener errores más comunes para este tipo de archivo
      const commonErrors = await this.getCommonErrors(fileType);
      const topErrors = Object.entries(commonErrors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => `${error} (${count} veces)`);

      return {
        recentCorrections: relevantCorrections,
        commonErrors: topErrors,
        statistics: history.statistics
      };
    } catch (error) {
      console.error('Error al obtener contexto para prompt:', error);
      return {
        recentCorrections: [],
        commonErrors: [],
        statistics: { totalFiles: 0, totalCorrections: 0, fileTypes: {} }
      };
    }
  }

  // Obtener estadísticas del historial
  async getStatistics() {
    try {
      const history = await this.getHistory();
      return history.statistics;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { totalFiles: 0, totalCorrections: 0, fileTypes: {} };
    }
  }

  // Limpiar historial (mantener solo estadísticas)
  async clearHistory() {
    try {
      const history = await this.getHistory();
      const cleanHistory = {
        corrections: [],
        commonErrors: {},
        statistics: history.statistics // Mantener estadísticas
      };
      
      await fs.writeJson(this.historyFilePath, cleanHistory, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error al limpiar historial:', error);
      return false;
    }
  }
}

module.exports = HistoryManager;
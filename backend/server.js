const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const xml2js = require('xml2js');

// Importar utilidades y servicios
const { validateFileContent, detectCommonErrors } = require('./utils/validators');
const HistoryManager = require('./utils/historyManager');
const OllamaService = require('./services/ollamaService');

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicializar servicios
const historyManager = new HistoryManager(process.env.HISTORY_FILE || './data/history.json');
const ollamaService = new OllamaService(
  process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
  process.env.OLLAMA_MODEL || 'llama3'
);

// Configurar almacenamiento de archivos con multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB por defecto
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || 'csv,json,xml,txt').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Función auxiliar para obtener el tipo de archivo
function getFileType(filename) {
  return path.extname(filename).toLowerCase().replace('.', '');
}

// Función auxiliar para leer y procesar contenido del archivo
async function processFileContent(filePath, fileType) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    switch (fileType) {
      case 'json':
        try {
          JSON.parse(content); // Validar que sea JSON válido
          return { content, processed: JSON.parse(content) };
        } catch (e) {
          return { content, processed: null, parseError: e.message };
        }
      
      case 'csv':
        return new Promise((resolve) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
              resolve({ content, processed: results });
            })
            .on('error', () => {
              resolve({ content, processed: null });
            });
        });
      
      case 'xml':
        try {
          const parser = new xml2js.Parser();
          const parsed = await parser.parseStringPromise(content);
          return { content, processed: parsed };
        } catch (e) {
          return { content, processed: null, parseError: e.message };
        }
      
      default:
        return { content, processed: content };
    }
  } catch (error) {
    throw new Error(`Error al leer archivo: ${error.message}`);
  }
}

// ENDPOINT: POST /upload - Subir y validar archivo
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo'
      });
    }

    const fileType = getFileType(req.file.originalname);
    const { content, processed, parseError } = await processFileContent(req.file.path, fileType);

    // Validar contenido del archivo
    const validation = validateFileContent(content, fileType);
    const commonErrors = detectCommonErrors(content, fileType);

    // Agregar error de parsing si existe
    if (parseError) {
      commonErrors.push(`Error de sintaxis: ${parseError}`);
    }

    const response = {
      success: true,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        type: fileType,
        path: req.file.path
      },
      content: content,
      processed: processed,
      validation: {
        isValid: validation.isValid && !parseError,
        errors: [...validation.errors, ...commonErrors]
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error en /upload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: POST /correct - Corregir archivo usando IA
app.post('/correct', async (req, res) => {
  try {
    const { content, fileType, errors = [], filename } = req.body;

    if (!content || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Contenido y tipo de archivo son requeridos'
      });
    }

    // Verificar disponibilidad de Ollama
    const isOllamaAvailable = await ollamaService.checkAvailability();
    
    if (!isOllamaAvailable) {
      return res.status(503).json({
        success: false,
        error: 'Servicio de IA (Ollama) no está disponible. Asegúrate de que Ollama esté ejecutándose.',
        correctedContent: content,
        explanation: 'No se pudo procesar con IA, se devuelve el contenido original.'
      });
    }

    // Obtener contexto del historial para mejorar las correcciones
    const historyContext = await historyManager.getContextForPrompt(fileType);

    // Llamar a Ollama para corregir el archivo
    const correctionResult = await ollamaService.correctFile(
      content,
      fileType,
      errors,
      historyContext
    );

    // Guardar en el historial independientemente del resultado
    if (correctionResult.success) {
      await historyManager.addCorrection(
        content,
        correctionResult.correctedContent,
        fileType,
        errors,
        correctionResult.explanation
      );
    }

    // Guardar archivo corregido si se especifica un nombre
    if (filename && correctionResult.success) {
      const correctedDir = './uploads/corrected';
      await fs.ensureDir(correctedDir);
      
      const correctedFilename = `corrected-${filename}`;
      const correctedPath = path.join(correctedDir, correctedFilename);
      
      await fs.writeFile(correctedPath, correctionResult.correctedContent, 'utf8');
      
      correctionResult.correctedFilePath = correctedPath;
      correctionResult.correctedFilename = correctedFilename;
    }

    res.json(correctionResult);

  } catch (error) {
    console.error('Error en /correct:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      correctedContent: req.body.content || '',
      explanation: `Error interno del servidor: ${error.message}`
    });
  }
});

// ENDPOINT: GET /preview/:filename - Vista previa de archivo corregido
app.get('/preview/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const correctedDir = './uploads/corrected';
    const filePath = path.join(correctedDir, filename);

    // Verificar que el archivo existe
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const fileType = getFileType(filename);

    // Procesar contenido para vista previa
    let processedContent;
    try {
      switch (fileType) {
        case 'json':
          processedContent = JSON.parse(content);
          break;
        case 'csv':
          processedContent = content.split('\n').map(line => line.split(','));
          break;
        case 'xml':
          const parser = new xml2js.Parser();
          processedContent = await parser.parseStringPromise(content);
          break;
        default:
          processedContent = content;
      }
    } catch (e) {
      processedContent = content; // Fallback al contenido original
    }

    res.json({
      success: true,
      filename: filename,
      fileType: fileType,
      content: content,
      processed: processedContent
    });

  } catch (error) {
    console.error('Error en /preview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: GET /history - Obtener estadísticas del historial
app.get('/history', async (req, res) => {
  try {
    const statistics = await historyManager.getStatistics();
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error en /history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: GET /models - Obtener modelos de IA disponibles
app.get('/models', async (req, res) => {
  try {
    const models = await ollamaService.getAvailableModels();
    const isAvailable = await ollamaService.checkAvailability();
    
    res.json({
      success: true,
      available: isAvailable,
      models: models,
      currentModel: ollamaService.model
    });
  } catch (error) {
    console.error('Error en /models:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      available: false,
      models: []
    });
  }
});

// ENDPOINT: POST /models - Cambiar modelo de IA
app.post('/models', async (req, res) => {
  try {
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Nombre del modelo es requerido'
      });
    }

    ollamaService.setModel(model);
    
    res.json({
      success: true,
      message: `Modelo cambiado a: ${model}`,
      currentModel: model
    });
  } catch (error) {
    console.error('Error al cambiar modelo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: DELETE /history - Limpiar historial
app.delete('/history', async (req, res) => {
  try {
    const result = await historyManager.clearHistory();
    
    if (result) {
      res.json({
        success: true,
        message: 'Historial limpiado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al limpiar historial'
      });
    }
  } catch (error) {
    console.error('Error al limpiar historial:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Error interno del servidor'
  });
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Inicializar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📡 Endpoint de salud: http://localhost:${PORT}/health`);
  console.log(`🤖 Ollama endpoint: ${ollamaService.endpoint}`);
  console.log(`📂 Directorio de uploads: ${process.env.UPLOAD_DIR || './uploads'}`);
});

// Manejo de cierre elegante
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;
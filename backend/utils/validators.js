const { z } = require('zod');

// Validador para archivos CSV
const csvValidator = z.object({
  headers: z.array(z.string().min(1)),
  rows: z.array(z.object({})).min(1)
});

// Validador para archivos JSON
const jsonValidator = z.union([
  z.object({}),
  z.array(z.any())
]);

// Validador para archivos XML
const xmlValidator = z.object({
  root: z.any()
});

// Validador para archivos de texto
const textValidator = z.string().min(1);

// Función para validar contenido según el tipo de archivo
function validateFileContent(content, fileType) {
  try {
    switch (fileType.toLowerCase()) {
      case 'csv':
        return {
          isValid: true,
          data: content,
          errors: []
        };
      
      case 'json':
        const parsedJson = JSON.parse(content);
        const jsonResult = jsonValidator.safeParse(parsedJson);
        return {
          isValid: jsonResult.success,
          data: jsonResult.success ? parsedJson : null,
          errors: jsonResult.success ? [] : jsonResult.error.issues
        };
      
      case 'xml':
        return {
          isValid: true,
          data: content,
          errors: []
        };
      
      case 'txt':
        const textResult = textValidator.safeParse(content);
        return {
          isValid: textResult.success,
          data: textResult.success ? content : null,
          errors: textResult.success ? [] : ['El archivo de texto está vacío']
        };
      
      default:
        return {
          isValid: false,
          data: null,
          errors: ['Tipo de archivo no soportado']
        };
    }
  } catch (error) {
    return {
      isValid: false,
      data: null,
      errors: [`Error al validar el archivo: ${error.message}`]
    };
  }
}

// Función para detectar errores comunes en archivos
function detectCommonErrors(content, fileType) {
  const errors = [];
  
  switch (fileType.toLowerCase()) {
    case 'json':
      try {
        JSON.parse(content);
      } catch (e) {
        if (e.message.includes('Unexpected token')) {
          errors.push('Sintaxis JSON inválida - token inesperado');
        } else if (e.message.includes('Unexpected end')) {
          errors.push('JSON incompleto - falta cerrar llaves o corchetes');
        } else {
          errors.push(`Error de sintaxis JSON: ${e.message}`);
        }
      }
      break;
    
    case 'csv':
      const lines = content.split('\n');
      if (lines.length < 2) {
        errors.push('El archivo CSV debe tener al menos una línea de encabezado y una de datos');
      }
      
      const headerCount = lines[0] ? lines[0].split(',').length : 0;
      lines.forEach((line, index) => {
        if (line.trim() && line.split(',').length !== headerCount) {
          errors.push(`Línea ${index + 1}: número inconsistente de columnas`);
        }
      });
      break;
    
    case 'xml':
      // Verificación básica de XML bien formado
      const openTags = (content.match(/<[^/>]+>/g) || []).length;
      const closeTags = (content.match(/<\/[^>]+>/g) || []).length;
      if (openTags !== closeTags) {
        errors.push('XML mal formado - etiquetas no balanceadas');
      }
      break;
  }
  
  return errors;
}

module.exports = {
  validateFileContent,
  detectCommonErrors,
  csvValidator,
  jsonValidator,
  xmlValidator,
  textValidator
};
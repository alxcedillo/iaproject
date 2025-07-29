const fetch = require('node-fetch');

class OllamaService {
  constructor(endpoint = 'http://localhost:11434/api/generate', model = 'llama3') {
    this.endpoint = endpoint;
    this.model = model;
  }

  // Preparar el prompt para corrección de archivos
  preparePrompt(content, fileType, errors, historyContext) {
    let prompt = `Eres un experto en corrección y validación de archivos. Tu tarea es corregir el siguiente archivo ${fileType.toUpperCase()} y proporcionar una explicación clara.

ARCHIVO A CORREGIR:
${content}

ERRORES DETECTADOS:
${errors.length > 0 ? errors.join('\n- ') : 'Ningún error específico detectado'}

`;

    // Agregar contexto del historial si está disponible
    if (historyContext && historyContext.commonErrors.length > 0) {
      prompt += `ERRORES COMUNES ANTERIORES (${fileType.toUpperCase()}):
${historyContext.commonErrors.join('\n- ')}

`;
    }

    if (historyContext && historyContext.recentCorrections.length > 0) {
      prompt += `CORRECCIONES RECIENTES SIMILARES:
${historyContext.recentCorrections.map(c => 
        `- ${c.fileType}: ${c.errors.join(', ')} -> ${c.aiExplanation?.substring(0, 100)}...`
      ).join('\n')}

`;
    }

    prompt += `INSTRUCCIONES:
1. Corrige todos los errores encontrados en el archivo
2. Mantén la estructura y formato original cuando sea posible
3. Si es JSON, asegúrate de que sea válido y bien formateado
4. Si es CSV, mantén la consistencia en columnas y formato
5. Si es XML, asegúrate de que esté bien formado
6. Proporciona una breve explicación de las correcciones realizadas

RESPUESTA REQUERIDA:
Responde ÚNICAMENTE con un JSON en este formato exacto:
{
  "correctedContent": "contenido corregido aquí",
  "explanation": "explicación breve de las correcciones realizadas"
}

No agregues texto adicional antes o después del JSON.`;

    return prompt;
  }

  // Llamar a Ollama para corrección
  async correctFile(content, fileType, errors = [], historyContext = null) {
    try {
      const prompt = this.preparePrompt(content, fileType, errors, historyContext);
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1, // Baja temperatura para respuestas más consistentes
            top_p: 0.9,
            top_k: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Respuesta vacía de Ollama');
      }

      // Intentar parsear la respuesta JSON
      let parsedResponse;
      try {
        // Limpiar la respuesta por si tiene texto adicional
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        // Si falla el parsing, crear una respuesta por defecto
        console.warn('Error al parsear respuesta de Ollama:', parseError);
        parsedResponse = {
          correctedContent: content, // Usar contenido original como fallback
          explanation: 'No se pudo procesar la corrección automática. ' + data.response.substring(0, 200)
        };
      }

      return {
        success: true,
        correctedContent: parsedResponse.correctedContent || content,
        explanation: parsedResponse.explanation || 'Corrección procesada',
        originalResponse: data.response
      };

    } catch (error) {
      console.error('Error al conectar con Ollama:', error);
      
      return {
        success: false,
        error: error.message,
        correctedContent: content, // Devolver contenido original como fallback
        explanation: `Error al procesar con IA: ${error.message}`
      };
    }
  }

  // Verificar si Ollama está disponible
  async checkAvailability() {
    try {
      const response = await fetch(this.endpoint.replace('/generate', '/tags'), {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.error('Ollama no está disponible:', error.message);
      return false;
    }
  }

  // Obtener modelos disponibles
  async getAvailableModels() {
    try {
      const response = await fetch(this.endpoint.replace('/generate', '/tags'), {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error al obtener modelos disponibles:', error);
      return [];
    }
  }

  // Cambiar modelo
  setModel(modelName) {
    this.model = modelName;
  }

  // Cambiar endpoint
  setEndpoint(endpoint) {
    this.endpoint = endpoint;
  }
}

module.exports = OllamaService;
# 🤖 Validador de Archivos con IA

Una aplicación completa que valida, corrige y optimiza archivos usando inteligencia artificial local con Ollama. Desarrollada con React + TailwindCSS (frontend) y Node.js + Express (backend).

## 🚀 Características

### ✨ Funcionalidades Principales
- **Validación automática** de archivos CSV, JSON, XML y TXT
- **Corrección inteligente** usando modelos de IA local (Ollama)
- **Vista previa visual** con formato específico por tipo de archivo
- **Comparador visual** entre archivo original y corregido
- **Aprendizaje incremental** basado en historial de correcciones
- **Interfaz moderna** y responsiva con TailwindCSS

### 🔧 Tecnologías
- **Frontend**: React 18+, TailwindCSS, CSS Grid/Flexbox
- **Backend**: Node.js 18+, Express.js, Multer, Zod
- **IA Local**: Ollama (LLaMA 3, Mistral, etc.)
- **Validación**: Zod para esquemas de datos
- **Historial**: JSON plano (configurable a SQLite)

## 📦 Instalación

### Prerrequisitos

1. **Node.js 18+** - [Descargar](https://nodejs.org/)
2. **Ollama** - [Instalar Ollama](https://ollama.ai/)

### 1. Instalar Ollama y modelo

```bash
# Instalar Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Descargar modelo (ejemplo: LLaMA 3)
ollama pull llama3

# Ejecutar Ollama
ollama serve
```

### 2. Configurar el proyecto

```bash
# Clonar/descargar el proyecto
cd file-validator-ai

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo en backend/
cd backend
cp .env.example .env

# Editar .env si es necesario (opcional)
# PORT=3001
# OLLAMA_ENDPOINT=http://localhost:11434/api/generate
# OLLAMA_MODEL=llama3
```

## 🎯 Uso

### Iniciar el sistema

```bash
# Terminal 1: Iniciar backend
cd backend
npm run dev

# Terminal 2: Iniciar frontend
cd frontend
npm start
```

### Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Flujo de trabajo

1. **📤 Subir archivo**: Arrastra o selecciona archivos (CSV, JSON, XML, TXT)
2. **🔍 Validación automática**: El sistema detecta errores de estructura/sintaxis
3. **🤖 Corrección con IA**: Si hay errores, usa IA local para corregirlos
4. **📊 Comparación visual**: Ve las diferencias lado a lado o unificadas
5. **💾 Descargar resultado**: Guarda el archivo corregido

## 📁 Estructura del Proyecto

```
file-validator-ai/
├── backend/                 # Servidor Node.js + Express
│   ├── services/           # Integración con Ollama
│   ├── utils/              # Validadores y gestión de historial
│   ├── data/               # Archivos de historial
│   ├── uploads/            # Archivos subidos
│   ├── server.js           # Servidor principal
│   └── package.json
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── App.js          # Aplicación principal
│   │   └── index.css       # Estilos TailwindCSS
│   ├── public/
│   ├── tailwind.config.js  # Configuración Tailwind
│   └── package.json
└── README.md
```

## 🛠️ API Endpoints

### Backend (Puerto 3001)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/upload` | Subir y validar archivo |
| POST | `/correct` | Corregir archivo con IA |
| GET | `/preview/:filename` | Vista previa de archivo corregido |
| GET | `/history` | Estadísticas del historial |
| GET | `/models` | Modelos de IA disponibles |
| POST | `/models` | Cambiar modelo de IA |
| DELETE | `/history` | Limpiar historial |
| GET | `/health` | Estado del servidor |

## 🎨 Componentes Frontend

### `FileUpload`
- Zona de arrastrar y soltar
- Validación de tipos de archivo
- Barra de progreso de subida

### `FilePreview`
- Vista formateada para JSON (árbol)
- Tabla para CSV con paginación
- Código formateado para XML/TXT
- Estadísticas del archivo

### `FileComparator`
- Vista lado a lado o unificada
- Resaltado de diferencias
- Estadísticas de cambios
- Acciones de descarga/copia

### `StatusBar`
- Estado de conexión Ollama
- Estadísticas del historial
- Modelos disponibles

## ⚙️ Configuración Avanzada

### Variables de Entorno (backend/.env)

```bash
# Servidor
PORT=3001
NODE_ENV=development

# Ollama
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3

# Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=csv,json,xml,txt

# Historial
HISTORY_FILE=./data/history.json
```

### Modelos Ollama Recomendados

```bash
# Modelos ligeros y rápidos
ollama pull llama3.2:1b
ollama pull qwen2.5:0.5b

# Modelos más potentes
ollama pull llama3:8b
ollama pull mistral:7b
ollama pull codellama:13b
```

## 🐛 Solución de Problemas

### Ollama no conecta
```bash
# Verificar que Ollama esté ejecutándose
curl http://localhost:11434/api/tags

# Reiniciar Ollama
ollama serve
```

### Errores de CORS
- El frontend usa proxy automático al backend
- Verificar que ambos servidores estén ejecutándose

### Archivos grandes
- Modificar `MAX_FILE_SIZE` en `.env`
- Considerar procesamiento en chunks para archivos > 50MB

### Rendimiento lento
- Usar modelos más pequeños (1B, 3B parámetros)
- Aumentar `temperature` para respuestas más rápidas
- Optimizar prompts en `ollamaService.js`

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para detalles.

## 🎯 Roadmap

- [ ] Soporte para más formatos (YAML, TOML)
- [ ] Integración con bases de datos (SQLite, PostgreSQL)
- [ ] API de configuración de prompts personalizados
- [ ] Dashboard de analytics avanzado
- [ ] Modo batch para múltiples archivos
- [ ] Integración con Git para tracking de cambios
- [ ] Plugin para VS Code

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/usuario/file-validator-ai/issues)
- **Documentación**: Ver `docs/` para guías detalladas
- **Ejemplos**: Ver `examples/` para casos de uso

---

⭐ **¡No olvides dar una estrella al proyecto si te resultó útil!**
# vLLM API

API REST para inferencia de modelos de lenguaje usando vLLM. Esta API proporciona endpoints para generar texto usando modelos de lenguaje grandes (LLMs) de manera eficiente.

## Características

- ✅ API REST con FastAPI
- ✅ Soporte para generación de texto individual y por lotes
- ✅ Configuración flexible de parámetros de generación (temperature, top_p, top_k, etc.)
- ✅ Documentación automática con Swagger/OpenAPI
- ✅ Health check endpoint
- ✅ CORS configurado
- ✅ Dockerizado y listo para producción

## Requisitos

- Docker y Docker Compose
- GPU con soporte CUDA (recomendado para mejor rendimiento)
- nvidia-docker (si usas GPU)

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto o configura estas variables en `docker-compose.yml`:

```env
VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
VLLM_TENSOR_PARALLEL_SIZE=1
VLLM_GPU_MEMORY_UTILIZATION=0.9
PORT=8000
```

### Modelos Soportados

vLLM soporta una amplia variedad de modelos. Algunos ejemplos:

- `meta-llama/Meta-Llama-3-8B-Instruct`
- `meta-llama/Meta-Llama-3-70B-Instruct`
- `mistralai/Mistral-7B-Instruct-v0.2`
- `Qwen/Qwen2-7B-Instruct`

Consulta la [documentación de vLLM](https://docs.vllm.ai/) para más modelos.

## Uso

### Iniciar el Servicio

```bash
docker-compose up -d vllm-api
```

### Ver Logs

```bash
docker-compose logs -f vllm-api
```

### Health Check

```bash
curl http://localhost:8000/health
```

## Endpoints

### 1. Health Check

**GET** `/health`

Verifica el estado de la API y si el modelo está cargado.

**Respuesta:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "meta-llama/Meta-Llama-3-8B-Instruct",
  "timestamp": "2024-01-15T10:30:00"
}
```

### 2. Generar Texto

**POST** `/api/v1/generate`

Genera texto basado en un prompt.

**Request Body:**
```json
{
  "prompt": "Hello, how are you?",
  "max_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 50,
  "stop": null,
  "stream": false
}
```

**Respuesta:**
```json
{
  "text": "I'm doing well, thank you for asking!",
  "prompt": "Hello, how are you?",
  "tokens_generated": 8,
  "finish_reason": "stop",
  "timestamp": "2024-01-15T10:30:00"
}
```

### 3. Generación por Lotes

**POST** `/api/v1/generate/batch`

Genera texto para múltiples prompts en un solo request.

**Request Body:**
```json
[
  {
    "prompt": "What is Python?",
    "max_tokens": 100
  },
  {
    "prompt": "What is JavaScript?",
    "max_tokens": 100
  }
]
```

**Respuesta:**
```json
{
  "results": [
    {
      "text": "Python is a high-level programming language...",
      "prompt": "What is Python?",
      "tokens_generated": 15,
      "finish_reason": "stop",
      "timestamp": "2024-01-15T10:30:00"
    },
    {
      "text": "JavaScript is a programming language...",
      "prompt": "What is JavaScript?",
      "tokens_generated": 12,
      "finish_reason": "stop",
      "timestamp": "2024-01-15T10:30:00"
    }
  ]
}
```

## Documentación Interactiva

Una vez que el servicio esté corriendo, puedes acceder a:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Parámetros de Generación

- **prompt** (requerido): El texto de entrada para generar
- **max_tokens** (opcional, default: 512): Número máximo de tokens a generar
- **temperature** (opcional, default: 0.7): Controla la aleatoriedad (0.0 = determinístico, 2.0 = muy aleatorio)
- **top_p** (opcional, default: 0.9): Nucleus sampling (0.0 a 1.0)
- **top_k** (opcional, default: 50): Top-k sampling
- **stop** (opcional): Lista de secuencias que detienen la generación
- **stream** (opcional, default: false): Si se debe generar en streaming (aún no implementado)

## Ejemplos de Uso

### Usando cURL

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms:",
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

### Usando Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/generate",
    json={
        "prompt": "What is artificial intelligence?",
        "max_tokens": 150,
        "temperature": 0.7
    }
)

result = response.json()
print(result["text"])
```

### Usando JavaScript/Node.js

```javascript
const axios = require('axios');

async function generateText() {
  const response = await axios.post('http://localhost:8000/api/v1/generate', {
    prompt: 'Tell me a joke:',
    max_tokens: 100,
    temperature: 0.8
  });
  
  console.log(response.data.text);
}

generateText();
```

## Integración con el Backend Node.js

Para usar esta API desde el backend Node.js existente, puedes crear un controlador:

```javascript
// backend/controllers/vllmController.js
import axios from 'axios';

const VLLM_API_URL = process.env.VLLM_API_URL || 'http://vllm-api:8000';

export const generateText = async (req, res) => {
  try {
    const { prompt, max_tokens, temperature } = req.body;
    
    const response = await axios.post(`${VLLM_API_URL}/api/v1/generate`, {
      prompt,
      max_tokens: max_tokens || 512,
      temperature: temperature || 0.7
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al generar texto', 
      details: error.message 
    });
  }
};
```

## Solución de Problemas

### El modelo no carga

1. Verifica que tienes suficiente memoria GPU/RAM
2. Revisa los logs: `docker-compose logs vllm-api`
3. Ajusta `VLLM_GPU_MEMORY_UTILIZATION` si es necesario

### Error de GPU

Si no tienes GPU o nvidia-docker, comenta la sección `deploy` en `docker-compose.yml`:

```yaml
# deploy:
#   resources:
#     reservations:
#       devices:
#         - driver: nvidia
```

### Puerto ya en uso

Cambia el puerto en `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Cambia 8000 a otro puerto
```

## Notas de Rendimiento

- vLLM está optimizado para GPUs. El rendimiento en CPU será significativamente más lento
- Para modelos grandes (>13B parámetros), se recomienda usar múltiples GPUs
- Ajusta `VLLM_GPU_MEMORY_UTILIZATION` según tu hardware disponible

## Licencia

Este proyecto sigue la misma licencia que el proyecto principal.

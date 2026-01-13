"""
API REST para vLLM usando FastAPI
Proporciona endpoints para generar texto usando modelos de lenguaje con vLLM
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import vllm
import os
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="vLLM API",
    description="API REST para inferencia de modelos de lenguaje usando vLLM",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic para validación
class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="El prompt de texto para generar")
    max_tokens: Optional[int] = Field(512, description="Número máximo de tokens a generar")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="Temperatura para la generación")
    top_p: Optional[float] = Field(0.9, ge=0.0, le=1.0, description="Top-p sampling")
    top_k: Optional[int] = Field(50, ge=1, description="Top-k sampling")
    stop: Optional[List[str]] = Field(None, description="Secuencias de parada")
    stream: Optional[bool] = Field(False, description="Si se debe generar en streaming")

class GenerateResponse(BaseModel):
    text: str = Field(..., description="Texto generado")
    prompt: str = Field(..., description="Prompt original")
    tokens_generated: Optional[int] = Field(None, description="Número de tokens generados")
    finish_reason: Optional[str] = Field(None, description="Razón de finalización")
    timestamp: str = Field(..., description="Timestamp de la generación")

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: Optional[str] = None
    timestamp: str

# Variable global para el modelo
llm_model: Optional[vllm.LLM] = None
model_name: Optional[str] = None

def load_model():
    """Cargar el modelo vLLM"""
    global llm_model, model_name
    
    if llm_model is not None:
        logger.info("Modelo ya está cargado")
        return
    
    try:
        # Obtener el nombre del modelo desde variables de entorno
        model_name = os.getenv("VLLM_MODEL", "meta-llama/Meta-Llama-3-8B-Instruct")
        logger.info(f"Cargando modelo: {model_name}")
        
        # Configuración del modelo
        model_kwargs = {
            "tensor_parallel_size": int(os.getenv("VLLM_TENSOR_PARALLEL_SIZE", "1")),
            "gpu_memory_utilization": float(os.getenv("VLLM_GPU_MEMORY_UTILIZATION", "0.9")),
        }
        
        # Cargar el modelo
        llm_model = vllm.LLM(model=model_name, **model_kwargs)
        
        logger.info(f"Modelo {model_name} cargado exitosamente")
    except Exception as e:
        logger.error(f"Error al cargar el modelo: {str(e)}")
        raise

@app.on_event("startup")
async def startup_event():
    """Cargar el modelo al iniciar la aplicación"""
    logger.info("Iniciando vLLM API...")
    load_model()
    logger.info("vLLM API lista para recibir solicitudes")

@app.get("/", tags=["General"])
async def root():
    """Endpoint raíz"""
    return {
        "message": "vLLM API está funcionando",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "generate": "/api/v1/generate",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    """Verificar el estado de la API y el modelo"""
    return HealthResponse(
        status="healthy" if llm_model is not None else "model_not_loaded",
        model_loaded=llm_model is not None,
        model_name=model_name,
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/v1/generate", response_model=GenerateResponse, tags=["Generation"])
async def generate_text(request: GenerateRequest):
    """
    Generar texto usando el modelo vLLM
    
    - **prompt**: El texto de entrada para generar
    - **max_tokens**: Número máximo de tokens a generar (default: 512)
    - **temperature**: Temperatura para la generación (default: 0.7)
    - **top_p**: Top-p sampling (default: 0.9)
    - **top_k**: Top-k sampling (default: 50)
    - **stop**: Lista de secuencias de parada
    - **stream**: Si se debe generar en streaming (default: False)
    """
    if llm_model is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no está cargado. Por favor, espere o verifique los logs."
        )
    
    try:
        logger.info(f"Generando texto para prompt: {request.prompt[:100]}...")
        
        # Preparar parámetros de generación
        sampling_params = vllm.SamplingParams(
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            max_tokens=request.max_tokens,
            stop=request.stop if request.stop else None,
        )
        
        # Generar texto
        outputs = llm_model.generate([request.prompt], sampling_params)
        
        # Extraer el texto generado
        output = outputs[0].outputs[0]
        generated_text = output.text
        finish_reason = output.finish_reason
        
        # Calcular tokens generados
        # Intentar obtener el número real de tokens, si está disponible
        try:
            tokens_generated = len(output.token_ids) if hasattr(output, 'token_ids') else len(generated_text.split())
        except:
            tokens_generated = len(generated_text.split())
        
        logger.info(f"Generación completada. Tokens generados: {tokens_generated}")
        
        return GenerateResponse(
            text=generated_text,
            prompt=request.prompt,
            tokens_generated=tokens_generated,
            finish_reason=finish_reason,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error al generar texto: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar texto: {str(e)}"
        )

@app.post("/api/v1/generate/batch", tags=["Generation"])
async def generate_batch(requests: List[GenerateRequest]):
    """
    Generar texto para múltiples prompts en lote
    """
    if llm_model is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no está cargado. Por favor, espere o verifique los logs."
        )
    
    try:
        prompts = [req.prompt for req in requests]
        
        # Usar los parámetros del primer request (podrías mejorarlo para usar parámetros individuales)
        first_request = requests[0]
        sampling_params = vllm.SamplingParams(
            temperature=first_request.temperature,
            top_p=first_request.top_p,
            top_k=first_request.top_k,
            max_tokens=first_request.max_tokens,
            stop=first_request.stop if first_request.stop else None,
        )
        
        # Generar para todos los prompts
        outputs = llm_model.generate(prompts, sampling_params)
        
        # Formatear respuestas
        responses = []
        for i, output in enumerate(outputs):
            output_data = output.outputs[0]
            generated_text = output_data.text
            finish_reason = output_data.finish_reason
            
            # Calcular tokens generados
            try:
                tokens_generated = len(output_data.token_ids) if hasattr(output_data, 'token_ids') else len(generated_text.split())
            except:
                tokens_generated = len(generated_text.split())
            
            responses.append({
                "text": generated_text,
                "prompt": prompts[i],
                "tokens_generated": tokens_generated,
                "finish_reason": finish_reason,
                "timestamp": datetime.now().isoformat()
            })
        
        return {"results": responses}
        
    except Exception as e:
        logger.error(f"Error en generación por lotes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en generación por lotes: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

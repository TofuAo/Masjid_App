/**
 * Controlador para interactuar con la API de vLLM
 * Proporciona endpoints para generar texto usando modelos de lenguaje
 */

import axios from 'axios';

const VLLM_API_URL = process.env.VLLM_API_URL || 'http://vllm-api:8000';

/**
 * Generar texto usando vLLM
 * POST /api/vllm/generate
 */
export const generateText = async (req, res) => {
  try {
    const { prompt, max_tokens, temperature, top_p, top_k, stop } = req.body;

    // Validar que el prompt esté presente
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El campo "prompt" es requerido y debe ser una cadena de texto'
      });
    }

    // Preparar el request para vLLM API
    const requestBody = {
      prompt: prompt.trim(),
      max_tokens: max_tokens || 512,
      temperature: temperature !== undefined ? temperature : 0.7,
      top_p: top_p !== undefined ? top_p : 0.9,
      top_k: top_k !== undefined ? top_k : 50,
      stop: stop || null
    };

    // Validar parámetros
    if (requestBody.temperature < 0 || requestBody.temperature > 2) {
      return res.status(400).json({
        success: false,
        message: 'La temperatura debe estar entre 0 y 2'
      });
    }

    if (requestBody.max_tokens < 1 || requestBody.max_tokens > 4096) {
      return res.status(400).json({
        success: false,
        message: 'max_tokens debe estar entre 1 y 4096'
      });
    }

    // Llamar a la API de vLLM
    const response = await axios.post(
      `${VLLM_API_URL}/api/v1/generate`,
      requestBody,
      {
        timeout: 300000 // 5 minutos de timeout para generaciones largas
      }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error al generar texto con vLLM:', error.message);

    // Manejar diferentes tipos de errores
    if (error.response) {
      // Error de la API de vLLM
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Error al generar texto',
        details: error.response.data?.detail || error.message
      });
    } else if (error.request) {
      // No se recibió respuesta (servicio no disponible)
      return res.status(503).json({
        success: false,
        message: 'El servicio de vLLM no está disponible',
        details: 'Por favor, verifica que el servicio esté corriendo'
      });
    } else {
      // Error en la configuración de la solicitud
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        details: error.message
      });
    }
  }
};

/**
 * Generar texto en lote
 * POST /api/vllm/generate/batch
 */
export const generateBatch = async (req, res) => {
  try {
    const { prompts } = req.body;

    // Validar que prompts esté presente y sea un array
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El campo "prompts" es requerido y debe ser un array no vacío'
      });
    }

    // Validar que cada prompt sea válido
    const validPrompts = prompts.map((p, index) => {
      if (typeof p === 'string') {
        return {
          prompt: p.trim(),
          max_tokens: 512,
          temperature: 0.7
        };
      } else if (typeof p === 'object' && p.prompt) {
        return {
          prompt: p.prompt.trim(),
          max_tokens: p.max_tokens || 512,
          temperature: p.temperature !== undefined ? p.temperature : 0.7,
          top_p: p.top_p || 0.9,
          top_k: p.top_k || 50,
          stop: p.stop || null
        };
      } else {
        throw new Error(`Prompt inválido en el índice ${index}`);
      }
    });

    // Llamar a la API de vLLM
    const response = await axios.post(
      `${VLLM_API_URL}/api/v1/generate/batch`,
      validPrompts,
      {
        timeout: 600000 // 10 minutos de timeout para lotes
      }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error al generar texto en lote con vLLM:', error.message);

    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Error al generar texto en lote',
        details: error.response.data?.detail || error.message
      });
    } else if (error.request) {
      return res.status(503).json({
        success: false,
        message: 'El servicio de vLLM no está disponible',
        details: 'Por favor, verifica que el servicio esté corriendo'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        details: error.message
      });
    }
  }
};

/**
 * Verificar el estado del servicio vLLM
 * GET /api/vllm/health
 */
export const checkHealth = async (req, res) => {
  try {
    const response = await axios.get(`${VLLM_API_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error al verificar salud de vLLM:', error.message);

    res.status(503).json({
      success: false,
      message: 'El servicio de vLLM no está disponible',
      details: error.message
    });
  }
};

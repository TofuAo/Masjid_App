/**
 * Rutas para la API de vLLM
 * Proporciona endpoints para generar texto usando modelos de lenguaje
 */

import { Router } from 'express';
import { generateText, generateBatch, checkHealth } from '../controllers/vllmController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Health check (público, sin autenticación)
router.get('/health', checkHealth);

// Endpoints protegidos (requieren autenticación)
router.post('/generate', authenticateToken, generateText);
router.post('/generate/batch', authenticateToken, generateBatch);

export default router;


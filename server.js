
// server.js (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// CORS (ajusta 'origin' conforme necessidade)
app.use(cors({
  origin: true, // ou ['http://localhost:5173'] por exemplo
  credentials: true,
}));

app.use(express.json());

// === Config Gemini ===
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Proxy para a API do Gemini
app.post('/api/gemini/generate', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
    }

    // Opcional: validação simples do body
    if (!req.body) {
      return res.status(400).json({ error: 'Body da requisição ausente.' });
    }

    const fetchUrl = `${GEMINI_URL}?key=${encodeURIComponent(API_KEY)}`;

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Encaminha o body como está (desde que o frontend siga o formato exigido pela API)
      body: JSON.stringify(req.body),
    });

    // Tenta ler o JSON; se falhar, captura o texto para debugging
    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error('Falha ao parsear JSON do Gemini. Resposta bruta:', text);
      return res.status(502).json({ error: 'Resposta inválida do Gemini.', raw: text });
    }

    if (!response.ok) {
      // Propaga status e payload de erro da API do Gemini
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error('Erro no proxy /api/gemini/generate:', err);
    return res.status(500).json({ error: 'Erro interno ao contactar Gemini.' });
  }
});

// === Servir frontend /public ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// rota raiz
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});

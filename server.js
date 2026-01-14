
// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// 1) Criar o app ANTES de usar app.*
const app = express();

// 2) Middlewares globais
app.use(cors());
app.use(express.json());

// 3) (Opcional) Servir frontend estático a partir de /public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// 4) Rota de saúde (evita "Cannot GET /")
app.get('/', (req, res) => {
  res.send('Servidor DarkBot está a correr! ✅');
});

// 5) Rota da API Gemini (exemplo)
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

app.post('/api/gemini/generate', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
    }

    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao contactar Gemini.' });
  }
});

// 6) Arrancar o servidor por último
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API a correr em http://localhost:${PORT}`);
});

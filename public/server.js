// server/server.js
// Instala: npm init -y && npm i express node-fetch cors helmet dotenv
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors()); // em produção restringe a origem
app.use(express.json({ limit: '64kb' }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.DEEPSEEK_API_KEY; // agora correto

if (!API_KEY) {
  console.error('ERRO: DEEPSEEK_API_KEY não definida no ambiente.');
  process.exit(1);
}

// Rota simples de health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Rota /api/chat — recebe { messages: [{role, content}, ...] }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).send('Formato inválido');
    }

    const systemPrompt = `
      Tu és Deep Seek, um assistente empático, cordial e explicativo.
      Mantém a conversa, valida sentimentos, pede clarificações quando necessário
      e fornece explicações claras e passo a passo. Usa linguagem respeitosa em português.
    `;

    const history = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10)
    ];

    // Chamada à API DeepSeek
    const apiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: history,
        max_tokens: 600,
        temperature: 0.7
      })
    });

    if (!apiResp.ok) {
      const text = await apiResp.text();
      console.error('Erro API DeepSeek:', apiResp.status, text);
      return res.status(502).send(`Erro na API DeepSeek: ${apiResp.status}`);
    }

    const json = await apiResp.json();

    const reply =
      json.choices?.[0]?.message?.content ||
      'Desculpa, não consegui gerar uma resposta.';

    res.json({ reply });

  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).send('Erro interno no servidor');
  }
});

app.listen(PORT, () =>
  console.log(`Server a correr na porta ${PORT}`)
);

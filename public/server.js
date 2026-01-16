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
app.use(express.json({limit:'64kb'}));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY; // define no servidor

if(!API_KEY){
  console.error('ERRO: OPENAI_API_KEY não definida no ambiente.');
  process.exit(1);
}

// Rota simples de health
app.get('/api/health', (req,res) => res.json({ok:true}));

// Rota /api/chat — recebe { messages: [{role, content}, ...] }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if(!messages || !Array.isArray(messages)) return res.status(400).send('Formato inválido');

    // Constrói prompt / payload para a API de IA
    // Ajusta conforme o provedor de IA que usas (ex.: OpenAI Chat completions)
    // Exemplo genérico para OpenAI Chat Completions v1
    const systemPrompt = `Tu és Deep Seek, um assistente empático, cordial e explicativo. Mantém a conversa, valida sentimentos, pede clarificações quando necessário e fornece explicações claras e passo a passo. Usa linguagem respeitosa em português.`;

    // Monta mensagens: system + histórico (limitado)
    const history = [
      { role: 'system', content: systemPrompt },
      // inclui apenas as últimas 10 mensagens para controlar custo
      ...messages.slice(-10)
    ];

    // Chamada à API (exemplo OpenAI Chat Completions)
    const apiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // substitui conforme disponibilidade; ou usa 'gpt-4' / 'gpt-3.5-turbo'
        messages: history,
        max_tokens: 600,
        temperature: 0.7
      })
    });

    if(!apiResp.ok){
      const text = await apiResp.text();
      console.error('Erro API IA:', apiResp.status, text);
      return res.status(502).send(`Erro na API de IA: ${apiResp.status}`);
    }

    const json = await apiResp.json();
    // Extrai resposta (ajusta conforme formato)
    const reply = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content
      ? json.choices[0].message.content
      : 'Desculpa, não consegui gerar uma resposta.';

    res.json({ reply });
  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).send('Erro interno no servidor');
  }
});

app.listen(PORT, ()=> console.log(`Server a correr na porta ${PORT}`));

const express = require('express');
const router = express.Router();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY não configurada nas variáveis de ambiente');
}



router.post('/', async (req, res) => {
  const { prompt } = req.body;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ text: 'GEMINI_API_KEY não configurada.' });
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Desculpe, não consegui responder agora.';
    res.json({ text });
  } catch (err) {
    console.error('Erro Gemini:', err?.response?.data || err.message || err);
    res.status(500).json({ text: 'Erro ao conectar à IA.' });
  }
});

module.exports = router;
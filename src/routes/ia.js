const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const chatIA = new GoogleGenAI({
  apiKey: process.env.MINHA_CHAVE
});

let ultimaChamadaMs = 0;
let ultimoInsight = null;
const COOLDOWN_MS = 20 * 60 * 1000;

async function gerarResposta(mensagem) {
  const modeloIA = await chatIA.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Responda em uma única frase curta (máx. 200 caracteres), em português, sobre o risco e a recomendação principal com base nesses eventos de segurança do pórtico Free-Flow: ${mensagem}`
  });

  const resposta = modeloIA.text;
  const tokens = modeloIA.usageMetadata;

  console.log(resposta);
  console.log("Uso de Tokens:", tokens);

  return resposta;
}

router.post("/insight", async (req, res) => {
  const contexto = req.body.contexto || req.body.mensagem || "";

  if (!contexto.trim()) {
    return res.status(400).json({
      insight: "Sem eventos suficientes para gerar insight no momento."
    });
  }

  const agora = Date.now();

  if (ultimoInsight && agora - ultimaChamadaMs < COOLDOWN_MS) {
    return res.json({ insight: ultimoInsight, reutilizado: true });
  }

  ultimaChamadaMs = agora;

  try {
    const resposta = await gerarResposta(contexto);

    const insight =
      (resposta && resposta.trim()) ||
      "Não foi possível gerar insight agora. Aguardando novos eventos de segurança.";

    ultimoInsight = insight;

    return res.json({ insight });
  } catch (error) {
    console.error("Erro IA:", error);

    if (error.status === 429) {
      return res.json({
        insight:
          ultimoInsight ||
          "Limite de uso da IA atingido. Novos insights serão gerados automaticamente em alguns minutos."
      });
    }

    return res.status(500).json({
      insight:
        ultimoInsight ||
        "Não foi possível gerar insight agora. Aguardando novos eventos de segurança."
    });
  }
});

module.exports = router;

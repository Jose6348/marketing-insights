import axios from 'axios';

const SENTIMENT_API_URL = process.env.SENTIMENT_API_URL || 'http://localhost:8000';
const SENTIMENT_API_TIMEOUT = parseInt(process.env.SENTIMENT_API_TIMEOUT || '5000', 10);

export async function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('texto inválido fornecido para análise de sentimento');
  }
  try {
    const response = await axios.post(`${SENTIMENT_API_URL}/sentiment`, { text },
      {
        timeout: SENTIMENT_API_TIMEOUT,
      }
    )


    const { label, score } = response.data;

    return {
      label,
      score,
      provider: 'sentiment-api',
      raw: response.data,
    }
  }
  catch (error) {
    console.error('Erro ao analisar o sentimento:', error.message);
    throw new Error('Falha na análise de sentimento');
  }
}


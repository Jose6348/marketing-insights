import express from 'express';
import cors from 'cors';
import { analyzeSentiment } from './src/services/sentimentService.js';
import reviewsRouter from './src/modules/reviews/reviews.routes.js';


const app = express();

app.use(cors());
app.use(express.json());

// rota de teste de verificação de saúde
app.get("/health", (req, res) => {
  res.json({ message: "API is working!" });
});

// Rota de teste para análise de sentimento
app.post("/teste/sentiment", async (req, res) => {
  const { text } = req.body;
  console.log(req.body)
  if (!text) {
    return res.
      status(400)
      .json({ error: "O campo 'text' é obrigatório." });
  }
  try {
    const result = await analyzeSentiment(text);
    res.json({
      input: text,
      result,
    });
  }
  catch (error) {
    {
      console.error('[server] Erro em teste/sentiment:', error.message);
      res.status(500)
        .json({ error: 'Erro ao analisar o sentimento.' });
    }
  }

});

// API de reviews
app.use("/api/reviews", reviewsRouter);


app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

export default app;

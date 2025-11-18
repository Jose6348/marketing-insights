import { Router } from "express";
import { analyzeSentiment } from "../../services/sentimentService.js";
import {
  createReview,
  listReviews,
  calculateMetrics,
} from "./reviewStore.js";

const router = Router();

/**
 * GET /api/reviews
 * Query opcional: ?product=NomeDoProduto
 */
router.get("/", (req, res) => {
  const { product } = req.query;

  const reviews = listReviews({ product });
  const metrics = calculateMetrics(reviews);

  return res.json({
    reviews,
    metrics,
  });
});

/**
 * POST /api/reviews
 * Body esperado:
 * {
 *   "productName": "Nome do Produto",
 *   "source": "Amazon",
 *   "rating": 4.5,
 *   "text": "texto da review"
 * }
 */
router.post("/", async (req, res) => {
  const { productName, source, rating, text } = req.body;

  if (!productName || !text) {
    return res
      .status(400)
      .json({ error: "productName e text são obrigatórios." });
  }

  try {
    const sentiment = await analyzeSentiment(text);

    const review = createReview({
      productName,
      source,
      rating,
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
      text,
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error("[reviews.routes] Erro ao criar review:", error.message);
    return res.status(500).json({
      error: "Erro interno ao criar review.",
    });
  }
});

export default router;

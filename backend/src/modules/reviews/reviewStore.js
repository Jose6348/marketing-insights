let reviews = [];
let nextId = 1;

/**
 * Cria uma nova review e guarda em memória.
 */
export function createReview({
  productName,
  source,
  rating,
  text,
  sentimentLabel,
  sentimentScore,
}) {
  const review = {
    id: nextId++,
    productName,
    source: source || "Desconhecida",
    rating: rating ?? null,
    text,
    sentimentLabel,
    sentimentScore,
    createdAt: new Date().toISOString(),
  };

  reviews.push(review);
  return review;
}

/**
 * Retorna todas as reviews, com filtro opcional por nome de produto.
 */
export function listReviews({ product } = {}) {
  if (!product) {
    return reviews;
  }

  const normalized = product.toLowerCase();
  return reviews.filter((r) =>
    r.productName.toLowerCase().includes(normalized)
  );
}

/**
 * Calcula métricas agregadas em cima de uma lista de reviews.
 * Isso já prepara o backend para entregar algo "pronto para dashboard".
 */
export function calculateMetrics(reviewsList) {
  const totalReviews = reviewsList.length;

  // Calcula score médio de sentimento (mais útil que rating)
  let avgSentimentScore = null;
  if (totalReviews > 0) {
    const scores = reviewsList
      .map((r) => r.sentimentScore)
      .filter((s) => typeof s === "number" && !isNaN(s));

    if (scores.length > 0) {
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      avgSentimentScore = sum / scores.length;
    }
  }

  const sentimentSummary = {
    positive: 0,
    neutral: 0,
    negative: 0,
    total: totalReviews,
  };

  reviewsList.forEach((r) => {
    if (sentimentSummary[r.sentimentLabel] !== undefined) {
      sentimentSummary[r.sentimentLabel]++;
    }
  });

  return {
    totalReviews,
    avgSentimentScore,
    sentimentSummary,
  };
}

export function resetReviews() {
  reviews = [];
  nextId = 1;
}

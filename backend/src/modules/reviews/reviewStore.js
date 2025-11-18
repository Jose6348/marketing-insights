// "Banco de dados" em memória só para o MVP.
// Se eu quiser evoluir depois para Prisma/SQLite/Postgres, eu troco a implementação
// mantendo a mesma interface.

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

  let avgRating = null;
  if (totalReviews > 0) {
    const ratings = reviewsList
      .map((r) => r.rating)
      .filter((r) => typeof r === "number");

    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr, 0);
      avgRating = sum / ratings.length;
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
    avgRating,
    sentimentSummary,
  };
}

/**
 * Só pra facilitar debug/teste se eu quiser limpar tudo.
 */
export function resetReviews() {
  reviews = [];
  nextId = 1;
}

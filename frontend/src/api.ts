// src/api.ts

// Base da API do backend. Em dev, uso o localhost padrão.
// Se eu quiser, posso sobrescrever com VITE_API_BASE_URL no futuro.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export type SentimentSummary = {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
};

export type Metrics = {
  totalReviews: number;
  avgSentimentScore: number | null;
  sentimentSummary: SentimentSummary;
};

export type Review = {
  id: number;
  productName: string;
  source: string;
  rating: number | null;
  text: string;
  sentimentLabel: "positive" | "neutral" | "negative";
  sentimentScore: number;
  createdAt: string;
};

export type ReviewsResponse = {
  reviews: Review[];
  metrics: Metrics;
};

// Busca reviews e métricas do backend.
// Aceita um filtro opcional de produto (pra usar depois, se eu quiser).
export async function fetchReviews(product?: string): Promise<ReviewsResponse> {
  const params = product
    ? `?product=${encodeURIComponent(product)}`
    : "";

  const res = await fetch(`${API_BASE_URL}/api/reviews${params}`);

  if (!res.ok) {
    throw new Error(
      `Erro ao carregar reviews (${res.status} ${res.statusText})`
    );
  }

  const data = (await res.json()) as ReviewsResponse;
  return data;
}

// Tipo para criar uma nova review
export type CreateReviewRequest = {
  productName: string;
  source?: string;
  rating?: number | null;
  text: string;
};

// Cria uma nova review no backend
export async function createReview(
  review: CreateReviewRequest
): Promise<Review> {
  const res = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Erro ao criar review (${res.status} ${res.statusText})`
    );
  }

  const data = (await res.json()) as Review;
  return data;
}

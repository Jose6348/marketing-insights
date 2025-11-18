import React, { useEffect, useState } from "react";
import { fetchReviews } from "./api";
import type { ReviewsResponse } from "./api";


const App: React.FC = () => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega reviews do backend assim que o app monta
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchReviews();
        console.log("[App] Reviews carregadas do backend", response);
        setData(response);
      } catch (err) {
        console.error("[App] Erro ao carregar reviews:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Erro inesperado ao carregar dados.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Derivo os números dos cards a partir da resposta do backend
  const metrics = data?.metrics;

  const totalReviews = metrics?.totalReviews ?? 0;
  const avgRating = metrics?.avgRating ?? null;

  const totalSentiment = metrics?.sentimentSummary.total ?? 0;
  const positiveCount = metrics?.sentimentSummary.positive ?? 0;
  const negativeCount = metrics?.sentimentSummary.negative ?? 0;

  const positivePct =
    totalSentiment > 0
      ? Math.round((positiveCount / totalSentiment) * 100)
      : 0;

  const negativePct =
    totalSentiment > 0
      ? Math.round((negativeCount / totalSentiment) * 100)
      : 0;

  // Função para formatar o label de sentimento em português
  const getSentimentLabel = (label: "positive" | "neutral" | "negative") => {
    switch (label) {
      case "positive":
        return "Positivo";
      case "neutral":
        return "Neutro";
      case "negative":
        return "Negativo";
      default:
        return "Neutro";
    }
  };

  // Função para obter a classe CSS do sentimento
  const getSentimentClass = (label: "positive" | "neutral" | "negative") => {
    return `sentiment-${label}`;
  };

  // Pega as reviews reais do backend, ordena por data (mais recentes primeiro) e limita a 10
  const reviews = data?.reviews
    ? [...data.reviews]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    : [];

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">
          <span className="dot" />
          <span>Marketing Insights</span>
        </div>
        <div className="header-right">
          <span className="tag">AI-Powered Reviews</span>
        </div>
      </header>

      <main className="app-main">
        {/* Estado de carregamento */}
        {loading && (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2>Carregando insights...</h2>
            <p className="metric-caption">
              Buscando reviews e métricas em tempo real do backend.
            </p>
          </div>
        )}

        {/* Estado de erro */}
        {error && !loading && (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2>Erro ao carregar dados</h2>
            <p className="metric-caption">{error}</p>
          </div>
        )}

        {/* Cards de métricas – sempre usam o que veio do backend */}
        <section className="metrics-grid">
          <div className="card">
            <h2>Total de reviews</h2>
            <p className="metric-number">{totalReviews}</p>
            <p className="metric-caption">
              Base atual carregada do backend
            </p>
          </div>

          <div className="card">
            <h2>Nota média</h2>
            <p className="metric-number">
              {avgRating !== null ? avgRating.toFixed(1) : "-"}
            </p>
            <p className="metric-caption">Escala de 1 a 5</p>
          </div>

          <div className="card">
            <h2>Sentimento</h2>
            <p className="metric-number">{positivePct}% positivo</p>
            <p className="metric-caption">{negativePct}% negativo</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="card table-card">
            <h2>Últimas reviews</h2>
            {reviews.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Fonte</th>
                    <th>Review</th>
                    <th>Sentimento</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td>{review.productName}</td>
                      <td>{review.source}</td>
                      <td>{review.text}</td>
                      <td className={getSentimentClass(review.sentimentLabel)}>
                        {getSentimentLabel(review.sentimentLabel)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="metric-caption" style={{ marginTop: "1rem" }}>
                {loading
                  ? "Carregando reviews..."
                  : "Nenhuma review cadastrada ainda. Adicione uma review usando o formulário ao lado."}
              </p>
            )}
          </div>

          <div className="card form-card">
            <h2>Adicionar review (placeholder)</h2>
            <p className="metric-caption">
              Aqui depois vamos integrar com o backend para salvar e analisar a
              review em tempo real.
            </p>
            <form className="review-form">
              <input placeholder="Nome do produto" disabled />
              <input placeholder="Fonte (Amazon, Loja, etc.)" disabled />
              <textarea
                placeholder="Texto da review"
                rows={4}
                disabled
              ></textarea>
              <button type="button" disabled>
                Em breve: enviar para análise de sentimento
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

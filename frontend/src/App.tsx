import React, { useEffect, useState } from "react";
import { fetchReviews, createReview } from "./api";
import type { ReviewsResponse, CreateReviewRequest } from "./api";


const App: React.FC = () => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<CreateReviewRequest>({
    productName: "",
    source: "",
    rating: null,
    text: "",
  });
  const [formErrors, setFormErrors] = useState<{
    productName?: string;
    text?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  const avgSentimentScore = metrics?.avgSentimentScore ?? null;

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

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const errors: { productName?: string; text?: string } = {};

    if (!formData.productName.trim()) {
      errors.productName = "Nome do produto é obrigatório";
    }

    if (!formData.text.trim()) {
      errors.text = "Texto da review é obrigatório";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpa erro do campo quando o usuário começa a digitar
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    // Limpa mensagens de sucesso/erro anteriores
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Handler para submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpa mensagens anteriores
    setSubmitSuccess(null);
    setSubmitError(null);

    // Valida o formulário
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Cria a review no backend
      await createReview({
        productName: formData.productName.trim(),
        source: formData.source?.trim() || undefined,
        rating: formData.rating || null,
        text: formData.text.trim(),
      });

      // Limpa o formulário
      setFormData({
        productName: "",
        source: "",
        rating: null,
        text: "",
      });

      // Mostra mensagem de sucesso
      setSubmitSuccess("Review criada com sucesso! Atualizando dados...");

      // Recarrega as reviews e métricas
      const response = await fetchReviews();
      setData(response);

      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("[App] Erro ao criar review:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar review.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h2>Score médio de sentimento</h2>
            <p className="metric-number">
              {avgSentimentScore !== null
                ? avgSentimentScore.toFixed(2)
                : "-"}
            </p>
            <p className="metric-caption">
              {avgSentimentScore !== null
                ? avgSentimentScore > 0.5
                  ? "Predominantemente positivo"
                  : avgSentimentScore < -0.5
                  ? "Predominantemente negativo"
                  : "Predominantemente neutro"
                : "Aguardando reviews"}
            </p>
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
            <h2>Adicionar review</h2>
            <p className="metric-caption">
              Preencha os campos abaixo para adicionar uma nova review. O sistema
              analisará automaticamente o sentimento do texto.
            </p>
            <form className="review-form" onSubmit={handleSubmit}>
              <div>
                <input
                  name="productName"
                  placeholder="Nome do produto *"
                  value={formData.productName}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                {formErrors.productName && (
                  <span className="form-error">{formErrors.productName}</span>
                )}
              </div>
              <div>
                <input
                  name="source"
                  placeholder="Fonte (Amazon, Loja, etc.)"
                  value={formData.source}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <textarea
                  name="text"
                  placeholder="Texto da review *"
                  rows={4}
                  value={formData.text}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                ></textarea>
                {formErrors.text && (
                  <span className="form-error">{formErrors.text}</span>
                )}
              </div>
              {submitSuccess && (
                <div className="form-success">{submitSuccess}</div>
              )}
              {submitError && (
                <div className="form-error-message">{submitError}</div>
              )}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enviando..."
                  : "Enviar para análise de sentimento"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

import React from "react";

type SentimentSummary = {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
};

type Metrics = {
  totalReviews: number;
  avgRating: number;
  sentimentSummary: SentimentSummary;
};

// Mock temporário só pra UI
const mockMetrics: Metrics = {
  totalReviews: 128,
  avgRating: 4.3,
  sentimentSummary: {
    total: 128,
    positive: 92,
    neutral: 20,
    negative: 16,
  },
};

const App: React.FC = () => {
  const { totalReviews, avgRating, sentimentSummary } = mockMetrics;

  const positivePct =
    sentimentSummary.total > 0
      ? Math.round((sentimentSummary.positive / sentimentSummary.total) * 100)
      : 0;

  const negativePct =
    sentimentSummary.total > 0
      ? Math.round((sentimentSummary.negative / sentimentSummary.total) * 100)
      : 0;

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
        <section className="metrics-grid">
          <div className="card">
            <h2>Total de reviews</h2>
            <p className="metric-number">{totalReviews}</p>
            <p className="metric-caption">Últimos 30 dias (mock)</p>
          </div>

          <div className="card">
            <h2>Nota média</h2>
            <p className="metric-number">{avgRating.toFixed(1)}</p>
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
            <h2>Últimas reviews (mock)</h2>
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
                <tr>
                  <td>Fone Bluetooth XYZ</td>
                  <td>Amazon</td>
                  <td>Qualidade de som excelente, bateria dura muito.</td>
                  <td className="sentiment-positive">Positivo</td>
                </tr>
                <tr>
                  <td>Mouse Gamer ABC</td>
                  <td>Loja Própria</td>
                  <td>Bom, mas o scroll parece um pouco frágil.</td>
                  <td className="sentiment-neutral">Neutro</td>
                </tr>
                <tr>
                  <td>Smartwatch Pro</td>
                  <td>ReclameAqui</td>
                  <td>
                    Bateria péssima, em duas semanas já começou a travar.
                  </td>
                  <td className="sentiment-negative">Negativo</td>
                </tr>
              </tbody>
            </table>
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

import { getSqlPool, sql } from "../../database/sqlServer.js";

let ensureTablePromise;

async function ensureReviewsTable(pool) {
  if (ensureTablePromise) {
    return ensureTablePromise;
  }

  const createTableSql = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reviews' AND xtype='U')
    BEGIN
      CREATE TABLE Reviews (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProductName NVARCHAR(255) NOT NULL,
        Source NVARCHAR(100) NULL,
        Rating FLOAT NULL,
        ReviewText NVARCHAR(MAX) NOT NULL,
        SentimentLabel NVARCHAR(50) NULL,
        SentimentScore FLOAT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END
  `;

  ensureTablePromise = pool
    .request()
    .query(createTableSql)
    .catch((error) => {
      ensureTablePromise = null;
      throw error;
    });

  return ensureTablePromise;
}

function mapReview(record) {
  return {
    id: record.Id,
    productName: record.ProductName,
    source: record.Source,
    rating: record.Rating,
    text: record.ReviewText,
    sentimentLabel: record.SentimentLabel,
    sentimentScore: record.SentimentScore,
    createdAt:
      typeof record.CreatedAt?.toISOString === "function"
        ? record.CreatedAt.toISOString()
        : record.CreatedAt,
  };
}

/**
 * Cria uma nova review e persiste no SQL Server.
 */
export async function createReview({
  productName,
  source,
  rating,
  text,
  sentimentLabel,
  sentimentScore,
}) {
  const pool = await getSqlPool();
  await ensureReviewsTable(pool);

  const result = await pool
    .request()
    .input("productName", sql.NVarChar(255), productName)
    .input("source", sql.NVarChar(100), source || null)
    .input("rating", sql.Float, typeof rating === "number" ? rating : null)
    .input("text", sql.NVarChar(sql.MAX), text)
    .input("sentimentLabel", sql.NVarChar(50), sentimentLabel || null)
    .input("sentimentScore", sql.Float, sentimentScore ?? null)
    .query(`
      INSERT INTO Reviews (
        ProductName, Source, Rating, ReviewText, SentimentLabel, SentimentScore
      )
      OUTPUT INSERTED.Id, INSERTED.ProductName, INSERTED.Source, INSERTED.Rating,
             INSERTED.ReviewText, INSERTED.SentimentLabel, INSERTED.SentimentScore, INSERTED.CreatedAt
      VALUES (@productName, @source, @rating, @text, @sentimentLabel, @sentimentScore);
    `);

  return mapReview(result.recordset[0]);
}

/**
 * Retorna todas as reviews, com filtro opcional por nome de produto.
 */
export async function listReviews({ product } = {}) {
  const pool = await getSqlPool();
  await ensureReviewsTable(pool);

  const request = pool.request();
  let query = `
    SELECT
      Id,
      ProductName,
      Source,
      Rating,
      ReviewText,
      SentimentLabel,
      SentimentScore,
      CreatedAt
    FROM Reviews
  `;

  if (product) {
    request.input("product", sql.NVarChar(255), `%${product}%`);
    query += " WHERE ProductName LIKE @product";
  }

  query += " ORDER BY CreatedAt DESC";

  const result = await request.query(query);
  return result.recordset.map(mapReview);
}

/**
 * Calcula metricas agregadas em cima de uma lista de reviews.
 * Isso ja deixa o backend pronto para entregar dados ao dashboard.
 */
export function calculateMetrics(reviewsList) {
  const totalReviews = reviewsList.length;

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

export async function resetReviews() {
  const pool = await getSqlPool();
  await ensureReviewsTable(pool);
  await pool.request().query("TRUNCATE TABLE Reviews;");
}

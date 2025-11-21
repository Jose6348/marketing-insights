import sql from "mssql";

function parseBoolEnv(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return ["true", "1", "yes", "y"].includes(String(raw).toLowerCase());
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[database] Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function buildConfig() {
  const useWindowsAuth = parseBoolEnv("DB_USE_WINDOWS_AUTH", false);

  const config = {
    server: required("DB_SERVER"),
    database: required("DB_NAME"),
    port: parseInt(process.env.DB_PORT || "1433", 10),
    options: {
      encrypt: parseBoolEnv("DB_ENCRYPT", true),
      trustServerCertificate: parseBoolEnv("DB_TRUST_CERT", false),
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || "10", 10),
      min: parseInt(process.env.DB_POOL_MIN || "0", 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE || "30000", 10),
    },
  };

  if (useWindowsAuth) {
    config.authentication = {
      type: "ntlm",
      options: {
        domain: process.env.DB_DOMAIN || undefined,
        userName: process.env.DB_USER || undefined,
        password: process.env.DB_PASSWORD || undefined,
      },
    };
  } else {
    config.user = required("DB_USER");
    config.password = required("DB_PASSWORD");
  }

  return config;
}

let poolPromise;

export async function getSqlPool() {
  if (poolPromise) {
    return poolPromise;
  }

  const config = buildConfig();
  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
      pool.on("error", (err) => {
        console.error("[database] Erro no pool SQL Server:", err?.message);
        poolPromise = null;
      });
      return pool;
    })
    .catch((err) => {
      poolPromise = null;
      throw err;
    });

  return poolPromise;
}

export { sql };

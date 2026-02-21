CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT,
  whatsapp TEXT,
  email TEXT,
  interes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversaciones (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mensajes (
  id BIGSERIAL PRIMARY KEY,
  conversacion_id BIGINT REFERENCES conversaciones(id) ON DELETE CASCADE,
  quien TEXT CHECK (quien IN ('me','bot')) NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
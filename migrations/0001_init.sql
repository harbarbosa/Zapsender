CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE tenant_phone_provider AS ENUM ('cloud_api', 'dialog360', 'zapi', 'chatpro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE health_status AS ENUM ('unknown', 'ok', 'fail');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'media', 'template');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('queued', 'sending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  api_key_hash varchar NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  rate_limit_per_minute int NOT NULL DEFAULT 60,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tenants_api_key_hash_uq ON tenants(api_key_hash);

CREATE TABLE IF NOT EXISTS tenant_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider tenant_phone_provider NOT NULL,
  display_name varchar NOT NULL,
  phone_number varchar NULL,
  phone_id varchar NULL,
  business_account_id varchar NULL,
  access_token_enc text NOT NULL,
  webhook_verify_token_enc text NULL,
  is_active boolean NOT NULL DEFAULT true,
  health_status health_status NOT NULL DEFAULT 'unknown',
  last_health_check_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_phones_tenant_active_idx ON tenant_phones(tenant_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS tenant_phones_tenant_phone_id_uq ON tenant_phones(tenant_id, phone_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_phone_id uuid NULL REFERENCES tenant_phones(id) ON DELETE SET NULL,
  to varchar NOT NULL,
  type message_type NOT NULL,
  message text NULL,
  media_url text NULL,
  template_name varchar NULL,
  template_lang varchar NOT NULL DEFAULT 'pt_BR',
  status message_status NOT NULL DEFAULT 'queued',
  provider_message_id varchar NULL,
  error_code varchar NULL,
  error_message text NULL,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  scheduled_at timestamp NULL,
  sent_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_tenant_status_idx ON messages(tenant_id, status);
CREATE INDEX IF NOT EXISTS messages_tenant_created_idx ON messages(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS message_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  request_payload jsonb NOT NULL,
  response_payload jsonb NOT NULL,
  http_status int NULL,
  success boolean NOT NULL,
  error_message text NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_attempts_tenant_message_idx ON message_attempts(tenant_id, message_id);
CREATE INDEX IF NOT EXISTS message_attempts_tenant_created_idx ON message_attempts(tenant_id, created_at DESC);

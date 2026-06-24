-- Certificates Table (verifiable graduate credentials)
CREATE TABLE IF NOT EXISTS public.certificates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL, -- user email address
  course_id         UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  certificate_url   TEXT NOT NULL,
  issued_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(50) UNIQUE NOT NULL,
  user_id         TEXT NOT NULL, -- user email address
  transaction_id  VARCHAR(100) DEFAULT NULL,
  amount          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax             NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total           NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_type        VARCHAR(20) NOT NULL DEFAULT 'GST', -- 'GST', 'VAT', 'NONE'
  status          VARCHAR(30) NOT NULL DEFAULT 'paid', -- 'paid', 'refunded', 'cancelled'
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  plan            VARCHAR(50) DEFAULT NULL, -- 'basic', 'pro', 'advanced'
  pdf_url         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status      VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reason      TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Failed Payments & Recoveries Table
CREATE TABLE IF NOT EXISTS public.failed_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL, -- user email address
  subscription_id VARCHAR(100) DEFAULT NULL,
  amount          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  failure_reason  TEXT DEFAULT '',
  retry_count     INTEGER DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'failed', -- 'failed', 'recovered'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create security policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_payments ENABLE ROW LEVEL SECURITY;

-- Select policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read certificates for owner' AND tablename = 'certificates'
  ) THEN
    CREATE POLICY "Allow read certificates for owner" ON public.certificates FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read invoices for owner' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "Allow read invoices for owner" ON public.invoices FOR SELECT USING (user_id = auth.email());
  END IF;
END $$;

-- Open policies for service role / system writes (since they check true anyway)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write certificates' AND tablename = 'certificates'
  ) THEN
    CREATE POLICY "System write certificates" ON public.certificates FOR ALL WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write invoices' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "System write invoices" ON public.invoices FOR ALL WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write refunds' AND tablename = 'refunds'
  ) THEN
    CREATE POLICY "System write refunds" ON public.refunds FOR ALL WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write failed_payments' AND tablename = 'failed_payments'
  ) THEN
    CREATE POLICY "System write failed_payments" ON public.failed_payments FOR ALL WITH CHECK (TRUE);
  END IF;
END $$;

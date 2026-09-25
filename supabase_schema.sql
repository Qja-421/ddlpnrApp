-- ========================================================================
-- SCHEMA SQL OFFICIEL SUPABASE POUR LA DDL-PN (RÉPUBLIQUE DU CONGO)
-- Exécuter ce script dans le "SQL Editor" de votre tableau de bord Supabase.
-- ========================================================================

-- 1. Table des établissements recensés sur le terrain (Module Terrain SAA)
CREATE TABLE IF NOT EXISTS public.establishments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    promoter TEXT NOT NULL,
    phone TEXT,
    district TEXT NOT NULL,
    address TEXT,
    activity_code TEXT NOT NULL,
    activity_label TEXT NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('formal', 'informal')),
    rccm TEXT,
    surface_sqm NUMERIC(10, 2) DEFAULT 0,
    identified_date TEXT,
    identified_by TEXT,
    status TEXT NOT NULL DEFAULT 'identifie',
    filing_fee NUMERIC(12, 2) DEFAULT 30000,
    penalty_fee NUMERIC(12, 2) DEFAULT 0,
    rate_per_sqm NUMERIC(12, 2) DEFAULT 1200,
    total_due NUMERIC(12, 2) DEFAULT 0,
    installments_count INT DEFAULT 1,
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    next_due_date TEXT,
    payment_history JSONB DEFAULT '[]'::jsonb,
    sanctions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table du Registre d'Instruction des Actes et Demandes
CREATE TABLE IF NOT EXISTS public.dossiers_actes (
    id TEXT PRIMARY KEY,
    num TEXT UNIQUE NOT NULL,
    date TEXT,
    service_code TEXT DEFAULT 'SAA / J.A.M.',
    title TEXT NOT NULL,
    promoter TEXT NOT NULL,
    loc TEXT,
    arrondissement TEXT NOT NULL,
    category TEXT NOT NULL,
    type_label TEXT,
    type_sub TEXT,
    pieces_count INT DEFAULT 0,
    total_pieces INT DEFAULT 5,
    pieces_status TEXT,
    status_key TEXT NOT NULL DEFAULT 'reserves',
    status_label TEXT,
    status_sub TEXT,
    pieces_list JSONB DEFAULT '[]'::jsonb,
    avis_motive TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Activation de la synchronisation en temps réel (Supabase Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dossiers_actes;

-- 4. Politiques d'accès (RLS ouvert pour l'application DDL-PN)
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers_actes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture et écriture autorisée pour l'application DDL"
ON public.establishments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Lecture et écriture autorisée pour le registre DDL"
ON public.dossiers_actes FOR ALL USING (true) WITH CHECK (true);

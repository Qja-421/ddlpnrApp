import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://nbpcecsnivfggyitpxdn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icGNlY3NuaXZmZ2d5aXRweGRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI4OTI2NiwiZXhwIjoyMTAzODY1MjY2fQ.PVU6ZECng32GvVrB-XqJAw6CVVqwqjm66nYfnyYJNeY';

// Supabase client with admin privileges (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Health check & Supabase connection test
  app.get('/api/health', async (_req, res) => {
    try {
      const { count, error } = await supabaseAdmin
        .from('establishments')
        .select('*', { count: 'exact', head: true });
      if (error) {
        return res.status(500).json({ status: 'error', error: error.message });
      }
      return res.json({
        status: 'ok',
        supabaseConnected: true,
        establishmentsCount: count,
        url: SUPABASE_URL,
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 2. Fetch establishments joined with terrain_records
  app.get('/api/establishments', async (_req, res) => {
    try {
      const [estsRes, recsRes] = await Promise.all([
        supabaseAdmin
          .from('establishments')
          .select('*')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('terrain_records')
          .select('*')
          .order('record_date', { ascending: false }),
      ]);

      if (estsRes.error) {
        return res.status(500).json({ error: estsRes.error.message });
      }

      const establishments = estsRes.data || [];
      const records = recsRes.data || [];

      return res.json({ establishments, records });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. Create a new establishment
  app.post('/api/establishments', async (req, res) => {
    try {
      const { establishment, record } = req.body;
      if (!establishment || !establishment.name) {
        return res.status(400).json({ error: 'Nom établissement requis' });
      }

      const { data: createdEst, error: estError } = await supabaseAdmin
        .from('establishments')
        .insert(establishment)
        .select()
        .single();

      if (estError) {
        return res.status(500).json({ error: estError.message });
      }

      let createdRecord = null;
      if (record && createdEst?.id) {
        record.establishment_id = createdEst.id;
        delete record.remaining_balance; // auto-computed column
        const { data: recData, error: recError } = await supabaseAdmin
          .from('terrain_records')
          .insert(record)
          .select()
          .single();
        if (recError) {
          console.warn('Initial terrain record insert error:', recError.message);
        } else {
          createdRecord = recData;
        }
      }

      return res.status(201).json({ establishment: createdEst, record: createdRecord });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. Record a payment on the terrain or direction
  app.post('/api/payments', async (req, res) => {
    try {
      const { payment } = req.body;
      if (!payment || !payment.establishment_id) {
        return res.status(400).json({ error: 'establishment_id requis' });
      }

      delete payment.remaining_balance; // generated column
      const { data, error } = await supabaseAdmin
        .from('terrain_records')
        .insert(payment)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ payment: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. Fetch instruction dossiers (bypasses RLS)
  app.get('/api/dossiers', async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('dossiers_instruction')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ dossiers: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. Upsert an instruction dossier
  app.post('/api/dossiers', async (req, res) => {
    try {
      const { dossier } = req.body;
      if (!dossier) {
        return res.status(400).json({ error: 'Données de dossier requises' });
      }

      const { data, error } = await supabaseAdmin
        .from('dossiers_instruction')
        .upsert(dossier)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ dossier: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7. Fetch active agents and their badges
  app.get('/api/agents', async (_req, res) => {
    try {
      const [agentsRes, badgesRes] = await Promise.all([
        supabaseAdmin.from('agents').select('*').order('nom', { ascending: true }),
        supabaseAdmin.from('badges').select('*'),
      ]);

      if (agentsRes.error) {
        return res.status(500).json({ error: agentsRes.error.message });
      }

      const agents = agentsRes.data || [];
      const badges = badgesRes.data || [];

      const agentsWithBadges = agents.map((agent) => {
        const badge = badges.find((b) => b.agent_id === agent.id);
        return {
          ...agent,
          badge_number: badge ? badge.badge_number : agent.badge_id || 'DDL-PN-AGENT',
          badge_status: badge ? badge.status : agent.statut,
        };
      });

      return res.json({ agents: agentsWithBadges });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Dev server or Production static serving
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DDL-PN] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[DDL-PN] Connected to Supabase: ${SUPABASE_URL}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

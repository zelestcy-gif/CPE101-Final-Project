// Vercel Serverless Function: returns public Supabase keys from environment variables
// The anon/public key is safe to expose to client-side code

export default function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase keys are not configured on the server.' })
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(JSON.stringify({ SUPABASE_URL, SUPABASE_ANON_KEY }))
}

// Replace the placeholders below with your Supabase project values.
// WARNING: Do not commit real keys to public repos. This file is intentionally simple for demo purposes.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const SUPABASE_URL = 'https://nqchsbvdsfvbwqkowyrx.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xY2hzYnZkc2Z2Yndxa293eXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjIzMDYsImV4cCI6MjA3ODUzODMwNn0.PJ1Mk1OC9MPpsFXoeJ04kfmP_ThIBtAVGDT4ziMOGSc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
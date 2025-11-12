// supabaseClient.js

// 1. Paste your actual Project URL here
const SUPABASE_URL = 'https://nqchsbvdsfvbwqkowyrx.supabase.co/';

// 2. Paste your actual 'anon' Public Key here
const SUPABASE_ANON_KEY = 'nqchsbvdsfvbwqkowyrx';

// Initialize the Supabase client
// This creates the 'supabase' object that all other JS files will use.
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Initialize Supabase client by fetching public keys from a runtime endpoint.
// This works well on Vercel where env vars are available to serverless functions.
// For local development copy `.env.local.example` -> `.env.local` and either
// use a local dev server that proxies `/api/config` to return the vars, or
// set window.__SUPABASE_URL and window.__SUPABASE_ANON_KEY before loading the app.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export let supabase = null

export async function initSupabase() {
  // If already initialized, return it
  if (supabase) return supabase

  let SUPABASE_URL = null
  let SUPABASE_ANON_KEY = null

  // Strategy 1: Try to fetch runtime config from /api/config (Vercel serverless function)
  try {
    console.log('Attempting to fetch config from /api/config...')
    const res = await fetch('/api/config')
    if (res.ok) {
      const json = await res.json()
      SUPABASE_URL = json.SUPABASE_URL
      SUPABASE_ANON_KEY = json.SUPABASE_ANON_KEY
      console.log('Successfully loaded config from /api/config')
    } else {
      console.warn('API config endpoint returned:', res.status, res.statusText)
    }
  } catch (err) {
    console.warn('Could not fetch from /api/config:', err.message)
  }

  // Strategy 2: Check window globals (for manual configuration)
  if (!SUPABASE_URL && window.__SUPABASE_URL) {
    SUPABASE_URL = window.__SUPABASE_URL
    SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY
    console.log('Using window globals for Supabase config')
  }

  // Strategy 3: Check localStorage (for fallback)
  if (!SUPABASE_URL && localStorage.getItem('sb_url')) {
    SUPABASE_URL = localStorage.getItem('sb_url')
    SUPABASE_ANON_KEY = localStorage.getItem('sb_key')
    console.log('Using localStorage for Supabase config')
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase configuration not found!')
    console.error('Make sure to:')
    console.error('1. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables on Vercel')
    console.error('2. OR set window.__SUPABASE_URL and window.__SUPABASE_ANON_KEY in your HTML')
    console.error('3. OR use the admin console to configure them')
    alert('❌ Supabase is not configured. Check the browser console for details.')
    return null
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log('✅ Supabase initialized successfully')
    return supabase
  } catch (err) {
    console.error('Error creating Supabase client:', err)
    alert('❌ Failed to initialize Supabase. Check the browser console.')
    return null
  }
}


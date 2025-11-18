import { initSupabase, supabase as _supabase } from './supabaseConfig.js'

// Initialize Supabase first, then wire up UI
(async function init() {
  const supabase = await initSupabase()
  if (!supabase) {
    console.error('❌ Supabase initialization failed. Check your environment variables.')
    if (window.logDebug) window.logDebug('❌ Supabase failed to initialize');
    return
  }

  if (window.logDebug) window.logDebug('✅ Supabase initialized');

  const emailEl = document.getElementById('email')
  const passwordEl = document.getElementById('password')
  const signupBtn = document.getElementById('signup')
  const signinBtn = document.getElementById('signin')
  const msg = document.getElementById('message')

  function setMessage(text, isError = true) {
    msg.textContent = text
    if (text) {
      msg.className = 'message ' + (isError ? 'error' : 'success')
    } else {
      msg.className = 'message'
    }
    console.log((isError ? '❌' : '✅') + ' ' + text)
    if (window.logDebug) window.logDebug((isError ? '❌' : '✅') + ' ' + text);
  }

  signupBtn.addEventListener('click', async () => {
    setMessage('')
    const email = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) return setMessage('Please enter email and password')

    if (window.logDebug) window.logDebug('Attempting sign up with: ' + email);
    signupBtn.disabled = signinBtn.disabled = true
    const { data, error } = await supabase.auth.signUp({ email, password })
    signupBtn.disabled = signinBtn.disabled = false

    if (error) {
      console.error('Sign up error:', error)
      return setMessage('Sign up error: ' + error.message)
    }

    setMessage('Check your email for a confirmation link (if required).', false)
  })

  signinBtn.addEventListener('click', async () => {
    setMessage('')
    const email = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) return setMessage('Please enter email and password')

    if (window.logDebug) window.logDebug('Attempting sign in with: ' + email);
    signupBtn.disabled = signinBtn.disabled = true
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    signupBtn.disabled = signinBtn.disabled = false

    if (error) {
      console.error('Sign in error:', error)
      if (window.logDebug) window.logDebug('❌ Sign in failed: ' + error.message);
      return setMessage('Sign in error: ' + error.message)
    }

    if (window.logDebug) window.logDebug('✅ Sign in successful! Redirecting...');
    // On success redirect to dashboard
    window.location.href = '/dashboard.html'
  })

  // Optional: if user already logged in, redirect straight to dashboard
  (async function checkRedirect() {
    try {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        if (window.logDebug) window.logDebug('User already logged in, redirecting...');
        window.location.href = '/dashboard.html'
      }
    } catch (err) {
      console.error('Error checking user:', err)
    }
  })()
})()

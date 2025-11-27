import { initSupabase } from './supabaseConfig.js'

(async function init() {
  const supabase = await initSupabase()
  if (!supabase) {
    console.error('❌ Supabase initialization failed.')
    return
  }

  // --- UI Elements ---
  const emailEl = document.getElementById('email')
  const passwordEl = document.getElementById('password')
  const signinBtn = document.getElementById('signin')
  const signupBtn = document.getElementById('signup')
  const msg = document.getElementById('message')

  // --- Helpers ---
  function setMessage(text, isError = true) {
    msg.textContent = text
    msg.className = text ? ('message ' + (isError ? 'error' : 'success')) : 'message'
  }

  // --- Login / Signup Logic ---
  signinBtn.addEventListener('click', async () => {
    setMessage('')
    const email = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) return setMessage('Please enter email and password')

    signinBtn.disabled = true; signinBtn.textContent = "Checking...";
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    signinBtn.disabled = false; signinBtn.textContent = "Sign In";

    if (error) return setMessage('Sign in error: ' + error.message)
    window.location.href = 'dashboard.html'
  })

  signupBtn.addEventListener('click', async () => {
    setMessage('')
    const email = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) return setMessage('Please enter email and password')

    signupBtn.disabled = true; signupBtn.textContent = "Creating...";
    const { data, error } = await supabase.auth.signUp({ email, password })
    signupBtn.disabled = false; signupBtn.textContent = "Sign Up";

    if (error) return setMessage('Sign up error: ' + error.message)
    setMessage('Account created! Check your email to confirm.', false)
  })

  // --- Redirect Check ---
  // If user already logged in, go to dashboard
  const { data } = await supabase.auth.getUser()
  if (data?.user) window.location.href = 'dashboard.html'

})()
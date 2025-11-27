import { initSupabase } from './supabaseConfig.js'

(async function init() {
  const supabase = await initSupabase()
  if (!supabase) return

  // --- UI Elements ---
  const emailEl = document.getElementById('email')
  const passwordEl = document.getElementById('password')
  const signinBtn = document.getElementById('signin')
  const signupBtn = document.getElementById('signup')
  const msg = document.getElementById('message')
  
  // Forgot Password Elements
  const loginSection = document.getElementById('loginSection')
  const forgotSection = document.getElementById('forgotSection')
  const showForgotBtn = document.getElementById('showForgot')
  const showLoginBtn = document.getElementById('showLogin')
  const sendResetBtn = document.getElementById('sendReset')
  const resetEmailEl = document.getElementById('resetEmail')

  const googleBtn = document.getElementById('googleBtn');

  // --- Helpers ---
  function setMessage(text, isError = true) {
    msg.textContent = text
    msg.className = text ? ('message ' + (isError ? 'error' : 'success')) : 'message'
  }

  // --- Toggle Views ---
  showForgotBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setMessage('');
    loginSection.style.display = 'none';
    forgotSection.style.display = 'block';
    if(emailEl.value) resetEmailEl.value = emailEl.value;
  });

  showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setMessage('');
    forgotSection.style.display = 'none';
    loginSection.style.display = 'block';
  });

  // --- Logic: Send Password Reset Email ---
  sendResetBtn.addEventListener('click', async () => {
    const email = resetEmailEl.value.trim();
    if (!email) return setMessage('Please enter your email address');

    sendResetBtn.disabled = true; 
    sendResetBtn.textContent = "Sending...";
    setMessage('');

    const redirectUrl = window.location.origin + '/update-password.html';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    sendResetBtn.disabled = false;
    sendResetBtn.textContent = "Send Reset Link";

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the password reset link!', false);
    }
  });

  // --- Existing Login / Signup Logic ---
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

    // 1. DYNAMIC DOMAIN CHECK
    const { data: allowedRows, error: domainError } = await supabase
      .from('allowed_domains')
      .select('domain_name');

    if (domainError) return setMessage("System error: Could not verify domain.", true);

    const validDomain = allowedRows.find(row => email.endsWith(row.domain_name));
    if (!validDomain) {
      const readableList = allowedRows.map(r => r.domain_name).join(', ');
      return setMessage(`Access denied. You must use an email from: ${readableList}`, true);
    }

    // 2. SIGN UP ATTEMPT
    signupBtn.disabled = true; signupBtn.textContent = "Creating...";
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    signupBtn.disabled = false; signupBtn.textContent = "Sign Up";

    if (error) {
       return setMessage(error.message, true);
    }
    // ----------------------------------------
    
    setMessage('Account created! Check your email to confirm.', false)
  })

  if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    setMessage('');
    
    // UI Feedback
    googleBtn.disabled = true;
    googleBtn.innerHTML = 'Redirecting...';

    // 3. Trigger Supabase OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect back to this page (or dashboard) after Google login
        redirectTo: window.location.origin + '/dashboard.html',
        
        // OPTIONAL: Force Google to only allow specific domains (e.g., school email)
        // If you remove this, anyone with a Gmail account can log in.
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          // CHANGE THIS to your school domain if you want to restrict it
          // hd: 'kmutt.ac.th' 
        }
      }
    });

    if (error) {
      googleBtn.disabled = false;
      googleBtn.innerHTML = 'Sign in with Google'; // Reset text
      setMessage('Google Login Error: ' + error.message, true);
    }
  });
}

  // --- Redirect Check ---
  const { data } = await supabase.auth.getUser()
  if (data?.user) window.location.href = 'dashboard.html'

})()
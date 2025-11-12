import { supabase } from './supabaseConfig.js'

const emailEl = document.getElementById('email')
const passwordEl = document.getElementById('password')
const signupBtn = document.getElementById('signup')
const signinBtn = document.getElementById('signin')
const msg = document.getElementById('message')

function setMessage(text, isError = true) {
    msg.textContent = text
    msg.style.color = isError ? 'crimson' : 'green'
}

signupBtn.addEventListener('click', async () => {
    setMessage('')
    const email = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) return setMessage('Please enter email and password')

    signupBtn.disabled = signinBtn.disabled = true
    const { data, error } = await supabase.auth.signUp({ email, password })
    signupBtn.disabled = signinBtn.disabled = false

    if (error) return setMessage(error.message)

    setMessage('Check your email for a confirmation link (if required).', false)
})

signinBtn.addEventListener('click', async () => {
    setMessage('')
    const email = emailEl.value.trim()
    const password = passwordEl.value
    if (!email || !password) return setMessage('Please enter email and password')

    signupBtn.disabled = signinBtn.disabled = true
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    signupBtn.disabled = signinBtn.disabled = false

    if (error) return setMessage(error.message)

    // On success redirect to dashboard
    window.location.href = '/dashboard.html'
})

    // Optional: if user already logged in, redirect straight to dashboard
    (async function checkRedirect() {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
            window.location.href = '/dashboard.html'
        }
    })()
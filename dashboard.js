import { initSupabase } from './supabaseConfig.js'

// Initialize Supabase and wire up optional auth UI without forcing redirect
(async function init() {
  const supabase = await initSupabase()
  if (!supabase) {
    console.warn('Supabase not initialized — dashboard will operate in public mode')
  }

  // Toggle Login / Logout links based on auth state
  async function updateAuthUI() {
    const logoutBtn = document.getElementById('logoutBtn')

    if (!supabase) {
      if (logoutBtn) logoutBtn.style.display = 'none'
      return
    }

    try {
      const { data } = await supabase.auth.getUser()
      const user = data?.user || null
      if (user) {
        if (logoutBtn) {
          logoutBtn.style.display = 'inline-block'
          logoutBtn.textContent = 'Logout'
        }
      } else {
        if (logoutBtn) logoutBtn.style.display = 'none'
      }
    } catch (err) {
      console.warn('Could not get user:', err)
      if (logoutBtn) logoutBtn.style.display = 'none'
    }
  }

  // Hook logout (works if button present)
  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      if (!supabase) return window.location.href = '/index.html'
      await supabase.auth.signOut()
      // After sign out, show login link
      updateAuthUI()
      window.location.href = '/index.html'
    })
  }

  // Submission buttons
  const uploadButtons = document.querySelectorAll('[data-assignment-id]')
  uploadButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const assignmentId = btn.getAttribute('data-assignment-id')
      console.log('Upload clicked for assignment', assignmentId)
      // TODO: Implement file upload functionality
    })
  })

  // Anonymous DM form
  const dmForm = document.getElementById('dmForm')
  if (dmForm) {
    dmForm.addEventListener('submit', async (event) => {
      event.preventDefault()

      const topic = document.getElementById('dmTopic')?.value || ''
      const message = document.getElementById('dmMessage')?.value || ''
      const anonymous = document.getElementById('dmAnonymous')?.checked ?? true

      if (!message.trim()) {
        alert('Please enter a message')
        return
      }

      const payload = { topic, message, anonymous }
      console.log('DM submit payload:', payload)
      
      // TODO: Send to backend API or supabase table

      // Clear form on success
      dmForm.reset()
      alert('Message sent successfully!')
    })
  }

  // Initialize UI state
  updateAuthUI()
})()

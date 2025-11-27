import { initSupabase } from './supabaseConfig.js'

(async function init() {
  const supabase = await initSupabase()
  let currentUser = null;

  // --- SECURITY GATE ---
  // 1. If Supabase client fails, kick out
  if (!supabase) {
    window.location.href = '/index.html';
    return;
  }

  // 2. Check for active session immediately
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // User is NOT logged in. Redirect to Login Page.
    window.location.href = '/index.html';
    return;
  }

  // If we get here, the user is logged in.
  const { data } = await supabase.auth.getUser()
  currentUser = data?.user;

  // Initialize UI
  updateAuthUI();
  checkAdminStatus(); // <--- NEW: Check if user is admin
  
  // Load Content
  loadAnnouncements();
  loadSyllabus();
  loadLessons();
  loadGallery();
  loadProjects();
  loadAssignments();

  // Setup Lightbox (only need to do this once)
  setupLightbox();

  function updateAuthUI() {
    const logoutBtn = document.getElementById('logoutBtn')
    if (currentUser) {
      if(logoutBtn) logoutBtn.style.display = 'inline-block'
    }
  }

  // --- NEW: ADMIN CHECK ---
  async function checkAdminStatus() {
    if (!currentUser) return;

    // Check if the current user's email exists in the 'admins' table
    // The RLS policy typically restricts you to only see your own row in 'admins'
    const { data } = await supabase
      .from('admins')
      .select('email')
      .eq('email', currentUser.email)
      .single();

    // If data is returned, it means the user is an admin
    if (data) {
      const adminBtn = document.getElementById('adminBtn');
      if (adminBtn) adminBtn.style.display = 'inline-block';
    }
  }

  // LOGOUT LOGIC
  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = '/index.html';
    })
  }

  // --- DATA LOADERS ---

  async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const el = document.getElementById('announcements-list');
    if(!data || !data.length) { el.innerHTML = '<p class="text-muted">No announcements.</p>'; return; }
    el.innerHTML = data.map(item => `
      <div style="padding:0.8rem; border-bottom:1px solid #eee;">
        <div style="font-weight:600;">${item.title}</div>
        <div style="font-size:0.85rem; color:#666;">${item.content}</div>
      </div>
    `).join('');
  }

  async function loadSyllabus() {
    const { data } = await supabase.from('syllabus').select('*').order('week_number', { ascending: true });
    const el = document.getElementById('syllabus-body');
    if(!data || !data.length) { el.innerHTML = '<tr><td colspan="3">No syllabus data.</td></tr>'; return; }
    el.innerHTML = data.map(row => `
      <tr>
        <td>${row.week_number}</td>
        <td>${row.topic}</td>
        <td>${row.deliverables || ''} ${row.has_badge ? '<span class="badge-soft">Due</span>' : ''}</td>
      </tr>
    `).join('');
  }

  async function loadLessons() {
    const { data } = await supabase.from('lessons').select('*').order('week_number', { ascending: true });
    const el = document.getElementById('lessons-list');
    if(!data || !data.length) { el.innerHTML = '<p class="text-muted">No lessons posted.</p>'; return; }
    el.innerHTML = data.map(l => `
      <article class="lesson-item">
        <div class="lesson-week">${l.week_number}</div>
        <div class="lesson-title">${l.title}</div>
        <div>${l.description || ''}</div>
      </article>
    `).join('');
  }

  async function loadGallery() {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    const el = document.getElementById('gallery-grid');
    if(!data || !data.length) { el.innerHTML = '<p>No photos.</p>'; return; }
    
    el.innerHTML = data.map(img => `
      <div class="gallery-item" 
           style="background-image: url('${img.image_url}'); background-size: cover; cursor: pointer;"
           data-full-url="${img.image_url}"
           data-caption="${img.caption}">
        <span class="gallery-label">${img.caption}</span>
      </div>
    `).join('');

    // Add click listeners to open lightbox
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.getAttribute('data-full-url');
        const caption = item.getAttribute('data-caption');
        openLightbox(url, caption);
      });
    });
  }

  function setupLightbox() {
    const lightboxHtml = `
      <div id="lightbox" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:1000; justify-content:center; align-items:center; flex-direction:column;">
        <span id="closeLightbox" style="position:absolute; top:20px; right:30px; font-size:40px; color:white; cursor:pointer;">&times;</span>
        <img id="lightboxImg" style="max-width:90%; max-height:80vh; object-fit:contain; border:2px solid white; border-radius:4px;">
        <p id="lightboxCaption" style="color:white; margin-top:10px; font-size:1.1rem;"></p>
        <a id="lightboxDownload" href="#" download target="_blank" class="btn-primary" style="margin-top:15px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;">
          <span>Download Image</span>
        </a>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHtml);

    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('closeLightbox');
    
    // Close on click background or X
    closeBtn.addEventListener('click', () => { lightbox.style.display = 'none'; });
    lightbox.addEventListener('click', (e) => { 
      if(e.target === lightbox) lightbox.style.display = 'none'; 
    });
  }

  function openLightbox(url, caption) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    const dl = document.getElementById('lightboxDownload');

    img.src = url;
    cap.textContent = caption;
    dl.href = url;
    
    lightbox.style.display = 'flex';
  }

  async function loadProjects() {
    const { data } = await supabase.from('project_groups').select('*').order('name', { ascending: true });
    const el = document.getElementById('projects-list');
    if(!data || !data.length) { el.innerHTML = '<li>No groups formed.</li>'; return; }
    el.innerHTML = data.map(p => `
      <li class="project-item">
        <span>${p.name} — ${p.description || ''}</span>
        <span class="pill-soft">${p.category}</span>
      </li>
    `).join('');
  }

  // --- SUBMISSION LOGIC ---

  let activeAssignmentId = null; 

  async function loadAssignments() {
    // 1. Fetch Assignments
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Fetch YOUR submissions (if logged in)
    let mySubmissions = [];
    if (currentUser) {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_email', currentUser.email);
      mySubmissions = subs || [];
    }

    const el = document.getElementById('assignment-list');
    if (!assignments || !assignments.length) { 
      el.innerHTML = '<p>No active assignments.</p>'; 
      return; 
    }
    
    // 3. Merge & Render
    el.innerHTML = assignments.map(a => {
      const existingSub = mySubmissions.find(s => s.assignment_id === a.id);
      if (existingSub) {
        // STATE: SUBMITTED
        return `
          <div class="assignment-item" style="border-color: #22c55e; background: #f0fdf4;">
            <div>
              <div><strong>${a.title}</strong> <span class="badge-soft" style="background:#22c55e; color:white;">✅ Submitted</span></div>
              <div class="assignment-meta">
                 Submitted on: ${new Date(existingSub.submitted_at).toLocaleString()}
              </div>
              <a href="${existingSub.file_url}" target="_blank" style="font-size:0.75rem; color:var(--primary);">View File</a>
            </div>
            <button class="btn-outline remove-trigger" 
              data-sub-id="${existingSub.id}" 
              data-file-url="${existingSub.file_url}"
              style="border-color:#ef4444; color:#ef4444;">
              Remove
            </button>
          </div>
        `;
      } else {
        // STATE: NOT SUBMITTED
        return `
          <div class="assignment-item">
            <div>
              <div><strong>${a.title}</strong></div>
              <div class="assignment-meta">Due: ${a.due_date} • Format: ${a.format}</div>
            </div>
            <button class="btn-outline upload-trigger" data-id="${a.id}">Upload</button>
          </div>
        `;
      }
    }).join('');

    // Attach Listeners
    document.querySelectorAll('.upload-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(!currentUser) return alert("Please log in to submit assignments.");
        activeAssignmentId = e.target.getAttribute('data-id');
        document.getElementById('submissionFile').click(); 
      });
    });

    document.querySelectorAll('.remove-trigger').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(!confirm("Are you sure you want to remove this submission?")) return;
        const subId = e.target.getAttribute('data-sub-id');
        const fileUrl = e.target.getAttribute('data-file-url');
        
        try {
            const path = fileUrl.split('/course-content/')[1]; 
            if(path) await supabase.storage.from('course-content').remove([path]);
        } catch(err) { console.warn("Storage delete warning:", err); }

        const { error } = await supabase.from('submissions').delete().eq('id', subId);
        if(error) alert("Error removing submission: " + error.message);
        else { alert("Submission removed."); loadAssignments(); }
      });
    });
  }

  // Handle File Selection & Upload
  const fileInput = document.getElementById('submissionFile');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file || !activeAssignmentId) return;

    // UI Feedback
    const originalBtn = document.querySelector(`button[data-id="${activeAssignmentId}"]`);
    if(originalBtn) originalBtn.textContent = "Uploading...";

    // Upload to Storage
    // Organized path: submissions/ASSIGNMENT_ID/USER_EMAIL/FILENAME
    const fileName = `submissions/${activeAssignmentId}/${currentUser.email}/${Date.now()}_${file.name}`;
    
    const { error: upErr } = await supabase.storage.from('course-content').upload(fileName, file);
    
    if(upErr) {
      alert("Upload failed: " + upErr.message);
      if(originalBtn) originalBtn.textContent = "Upload";
      return;
    }

    // Insert into DB
    const { data: { publicUrl } } = supabase.storage.from('course-content').getPublicUrl(fileName);
    const { error: dbErr } = await supabase.from('submissions').insert([{
      assignment_id: activeAssignmentId,
      student_email: currentUser.email,
      file_url: publicUrl
    }]);

    if(dbErr) {
        alert("Database error: " + dbErr.message);
        if(originalBtn) originalBtn.textContent = "Upload";
    } else {
        alert("Assignment submitted successfully!");
        loadAssignments(); 
    }
    
    fileInput.value = '';
    activeAssignmentId = null;
  });

  // --- DM LOGIC ---
  const dmForm = document.getElementById('dmForm');
  if(dmForm) {
    dmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(!currentUser) return alert("Please log in to send DMs.");

      const topic = document.getElementById('dmTopic').value;
      const message = document.getElementById('dmMessage').value;
      const is_anonymous = document.getElementById('dmAnonymous').checked;

      const { error } = await supabase.from('messages').insert([{
        topic, 
        message, 
        is_anonymous, 
        student_email: currentUser.email 
      }]);

      if(error) alert("Error sending message: " + error.message);
      else { alert("Message sent!"); dmForm.reset(); }
    });
  }

})();
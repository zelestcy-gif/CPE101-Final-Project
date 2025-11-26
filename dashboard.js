import { initSupabase } from './supabaseConfig.js'

(async function init() {
  const supabase = await initSupabase()
  let currentUser = null;

  if (supabase) {
    const { data } = await supabase.auth.getUser()
    currentUser = data?.user;
    updateAuthUI();
    
    // Load Content
    loadAnnouncements();
    loadSyllabus();
    loadLessons();
    loadGallery();
    loadProjects();
    loadAssignments();
  } else {
    console.warn("Public mode only");
  }

  function updateAuthUI() {
    const logoutBtn = document.getElementById('logoutBtn')
    if (currentUser) {
      if(logoutBtn) logoutBtn.style.display = 'inline-block'
    } else {
      if(logoutBtn) logoutBtn.style.display = 'none'
    }
  }

  // LOGOUT
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
      <div class="gallery-item" style="background-image: url('${img.image_url}'); background-size: cover;">
        <span class="gallery-label">${img.caption}</span>
      </div>
    `).join('');
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
      // Check if we found a submission for this assignment
      const existingSub = mySubmissions.find(s => s.assignment_id === a.id);

      if (existingSub) {
        // --- STATE: SUBMITTED ---
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
        // --- STATE: NOT SUBMITTED ---
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

    // Attach Listeners for UPLOAD
    document.querySelectorAll('.upload-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(!currentUser) return alert("Please log in to submit assignments.");
        activeAssignmentId = e.target.getAttribute('data-id');
        document.getElementById('submissionFile').click(); 
      });
    });

    // Attach Listeners for REMOVE
    document.querySelectorAll('.remove-trigger').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(!confirm("Are you sure you want to remove this submission?")) return;
        
        const subId = e.target.getAttribute('data-sub-id');
        const fileUrl = e.target.getAttribute('data-file-url');
        
        // A. Delete from Storage
        try {
            const path = fileUrl.split('/course-content/')[1]; 
            if(path) {
                await supabase.storage.from('course-content').remove([path]);
            }
        } catch(err) { console.warn("Storage delete warning:", err); }

        // B. Delete from Database
        const { error } = await supabase.from('submissions').delete().eq('id', subId);
        
        if(error) alert("Error removing submission: " + error.message);
        else {
            alert("Submission removed.");
            loadAssignments(); // Refresh UI
        }
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

    // 1. Upload to Storage
    const fileName = `submissions/${activeAssignmentId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('course-content').upload(fileName, file);
    
    if(upErr) {
      alert("Upload failed: " + upErr.message);
      if(originalBtn) originalBtn.textContent = "Upload";
      return;
    }

    // 2. Get URL
    const { data: { publicUrl } } = supabase.storage.from('course-content').getPublicUrl(fileName);

    // 3. Insert into Submissions Table
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
        loadAssignments(); // Refresh list to show "Submitted" state
    }
    
    // Reset
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

      // Now we also send student_email. 
      // The Admin panel will decide whether to show it based on 'is_anonymous'.
      const { error } = await supabase.from('messages').insert([{
        topic, 
        message, 
        is_anonymous, 
        student_email: currentUser.email 
      }]);

      if(error) alert("Error sending message: " + error.message);
      else {
        alert("Message sent!");
        dmForm.reset();
      }
    });
  }

})();
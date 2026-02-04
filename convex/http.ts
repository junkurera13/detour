import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Admin page HTML
const getAdminHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Detour Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 600px; margin: 0 auto; }
    h1 {
      font-size: 24px;
      color: #111;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 24px;
    }
    .login-form {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .login-form input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      margin-bottom: 12px;
    }
    .login-form input:focus {
      outline: none;
      border-color: #fd6b03;
    }
    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #fd6b03; color: white; }
    .btn-approve { background: #22c55e; color: white; padding: 10px 16px; width: auto; }
    .btn-reject { background: #ef4444; color: white; padding: 10px 16px; width: auto; }
    .error { color: #ef4444; font-size: 14px; margin-top: 8px; }
    .user-card {
      background: white;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-photo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      background: #e5e7eb;
    }
    .user-info { flex: 1; }
    .user-name { font-weight: 600; color: #111; }
    .user-username { color: #6b7280; font-size: 14px; }
    .user-meta { color: #9ca3af; font-size: 12px; margin-top: 4px; }
    .user-actions { display: flex; gap: 8px; }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: #6b7280;
    }
    .loading { text-align: center; padding: 24px; color: #6b7280; }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-pending { background: #fef3c7; color: #d97706; }
    .stats {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-number { font-size: 24px; font-weight: 700; color: #fd6b03; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .logout-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 14px;
    }
    .logout-btn:hover { color: #111; }
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1001;
    }
    .toast.show { opacity: 1; }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal {
      background: white;
      border-radius: 20px;
      max-width: 400px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      position: relative;
      height: 300px;
      overflow: hidden;
      border-radius: 20px 20px 0 0;
    }
    .modal-photos {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      height: 100%;
    }
    .modal-photos::-webkit-scrollbar { display: none; }
    .modal-photo {
      min-width: 100%;
      height: 100%;
      object-fit: cover;
      scroll-snap-align: start;
    }
    .photo-dots {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
    }
    .photo-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.5);
    }
    .photo-dot.active { background: white; }
    .modal-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-body { padding: 20px; }
    .modal-name {
      font-size: 24px;
      font-weight: 700;
      color: #111;
    }
    .modal-username {
      color: #6b7280;
      margin-bottom: 12px;
    }
    .modal-section {
      margin-top: 16px;
    }
    .modal-section-title {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .modal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .modal-tag {
      background: #f3f4f6;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      color: #374151;
    }
    .modal-info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .modal-info-row svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .modal-actions .btn {
      flex: 1;
    }
    .instagram-link {
      color: #E4405F;
      text-decoration: none;
      font-weight: 500;
    }
    .user-card { cursor: pointer; transition: transform 0.2s; }
    .user-card:hover { transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="container">
    <div id="login-section">
      <h1>detour admin</h1>
      <p class="subtitle">manage waitlist applications</p>
      <div class="login-form">
        <input type="password" id="password" placeholder="enter admin password" />
        <button class="btn btn-primary" onclick="login()">login</button>
        <p class="error" id="login-error"></p>
      </div>
    </div>

    <div id="admin-section" style="display: none;">
      <div class="header">
        <div>
          <h1>waitlist</h1>
          <p class="subtitle">pending applications</p>
        </div>
        <button class="logout-btn" onclick="logout()">logout</button>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-number" id="pending-count">-</div>
          <div class="stat-label">pending</div>
        </div>
      </div>

      <div id="users-list">
        <div class="loading">loading...</div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
  <div class="modal-overlay" id="modal" style="display: none;" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-photos" id="modal-photos"></div>
        <div class="photo-dots" id="photo-dots"></div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-name" id="modal-name"></div>
        <div class="modal-username" id="modal-username"></div>

        <div class="modal-info-row" id="modal-location">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span id="modal-location-text"></span>
        </div>

        <div class="modal-info-row" id="modal-trip" style="display: none;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          <span>Next: <span id="modal-trip-text"></span></span>
        </div>

        <div class="modal-info-row" id="modal-instagram" style="display: none;">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          <a class="instagram-link" id="modal-instagram-link" href="#" target="_blank"></a>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Looking for</div>
          <div class="modal-tags" id="modal-looking-for"></div>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Lifestyle</div>
          <div class="modal-tags" id="modal-lifestyle"></div>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Interests</div>
          <div class="modal-tags" id="modal-interests"></div>
        </div>

        <div class="modal-section">
          <div class="modal-info-row">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Nomadic for <span id="modal-time-nomadic"></span></span>
          </div>
          <div class="modal-info-row">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>Signed up <span id="modal-signup-date"></span></span>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-reject" id="modal-reject-btn">reject</button>
        <button class="btn btn-approve" id="modal-approve-btn">approve</button>
      </div>
    </div>
  </div>

  <script>
    const CONVEX_URL = window.location.origin;
    let adminPassword = localStorage.getItem('adminPassword') || '';
    let usersData = [];
    let currentUserId = null;

    // Check if already logged in
    if (adminPassword) {
      verifyAndShow();
    }

    async function login() {
      const password = document.getElementById('password').value;
      if (!password) return;

      try {
        const res = await fetch(CONVEX_URL + '/admin/verify?password=' + encodeURIComponent(password));
        const data = await res.json();

        if (data.valid) {
          adminPassword = password;
          localStorage.setItem('adminPassword', password);
          showAdmin();
          loadUsers();
        } else {
          document.getElementById('login-error').textContent = 'invalid password';
        }
      } catch (e) {
        document.getElementById('login-error').textContent = 'error verifying password';
      }
    }

    async function verifyAndShow() {
      try {
        const res = await fetch(CONVEX_URL + '/admin/verify?password=' + encodeURIComponent(adminPassword));
        const data = await res.json();
        if (data.valid) {
          showAdmin();
          loadUsers();
        } else {
          logout();
        }
      } catch (e) {
        logout();
      }
    }

    function showAdmin() {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-section').style.display = 'block';
    }

    function logout() {
      adminPassword = '';
      localStorage.removeItem('adminPassword');
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('admin-section').style.display = 'none';
      document.getElementById('password').value = '';
      document.getElementById('login-error').textContent = '';
    }

    async function loadUsers() {
      try {
        const res = await fetch(CONVEX_URL + '/admin/users');
        usersData = await res.json();

        document.getElementById('pending-count').textContent = usersData.length;

        if (usersData.length === 0) {
          document.getElementById('users-list').innerHTML =
            '<div class="empty-state">no pending applications</div>';
          return;
        }

        document.getElementById('users-list').innerHTML = usersData.map(user => \`
          <div class="user-card" id="user-\${user.id}" onclick="showProfile('\${user.id}')">
            <img class="user-photo" src="\${user.photo || 'https://via.placeholder.com/64'}" alt="" />
            <div class="user-info">
              <div class="user-name">\${user.name}</div>
              <div class="user-username">@\${user.username}</div>
              <div class="user-meta">\${user.location} · \${formatDate(user.signupDate)}</div>
            </div>
            <div class="user-actions" onclick="event.stopPropagation()">
              <button class="btn btn-approve" onclick="approveUser('\${user.id}', '\${user.name}')">approve</button>
              <button class="btn btn-reject" onclick="rejectUser('\${user.id}', '\${user.name}')">reject</button>
            </div>
          </div>
        \`).join('');
      } catch (e) {
        document.getElementById('users-list').innerHTML =
          '<div class="error">error loading users</div>';
      }
    }

    function showProfile(userId) {
      const user = usersData.find(u => u.id === userId);
      if (!user) return;

      currentUserId = userId;

      // Photos
      const photosHtml = user.photos.length > 0
        ? user.photos.map(p => \`<img class="modal-photo" src="\${p}" alt="" />\`).join('')
        : '<img class="modal-photo" src="https://via.placeholder.com/400" alt="" />';
      document.getElementById('modal-photos').innerHTML = photosHtml;

      // Photo dots
      const dotsHtml = user.photos.map((_, i) => \`<div class="photo-dot \${i === 0 ? 'active' : ''}"></div>\`).join('');
      document.getElementById('photo-dots').innerHTML = dotsHtml;

      // Basic info
      document.getElementById('modal-name').textContent = user.name;
      document.getElementById('modal-username').textContent = '@' + user.username;
      document.getElementById('modal-location-text').textContent = user.location;

      // Future trip
      if (user.futureTrip) {
        document.getElementById('modal-trip').style.display = 'flex';
        document.getElementById('modal-trip-text').textContent = user.futureTrip;
      } else {
        document.getElementById('modal-trip').style.display = 'none';
      }

      // Instagram
      if (user.instagram) {
        document.getElementById('modal-instagram').style.display = 'flex';
        document.getElementById('modal-instagram-link').textContent = '@' + user.instagram;
        document.getElementById('modal-instagram-link').href = 'https://instagram.com/' + user.instagram;
      } else {
        document.getElementById('modal-instagram').style.display = 'none';
      }

      // Looking for
      document.getElementById('modal-looking-for').innerHTML = user.lookingFor
        .map(l => \`<span class="modal-tag">\${l}</span>\`).join('');

      // Lifestyle
      document.getElementById('modal-lifestyle').innerHTML = user.lifestyle
        .map(l => \`<span class="modal-tag">\${l.replace('-', ' ')}</span>\`).join('');

      // Interests
      document.getElementById('modal-interests').innerHTML = user.interests
        .map(i => \`<span class="modal-tag">\${i}</span>\`).join('');

      // Time nomadic
      document.getElementById('modal-time-nomadic').textContent = user.timeNomadic.replace('-', ' ');

      // Signup date
      document.getElementById('modal-signup-date').textContent = formatDate(user.signupDate);

      // Action buttons
      document.getElementById('modal-approve-btn').onclick = () => {
        closeModal();
        approveUser(user.id, user.name);
      };
      document.getElementById('modal-reject-btn').onclick = () => {
        closeModal();
        rejectUser(user.id, user.name);
      };

      // Show modal
      document.getElementById('modal').style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeModal(event) {
      if (event && event.target !== event.currentTarget) return;
      document.getElementById('modal').style.display = 'none';
      document.body.style.overflow = '';
      currentUserId = null;
    }

    function formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / 86400000);
      if (days === 0) return 'today';
      if (days === 1) return 'yesterday';
      if (days < 7) return days + ' days ago';
      return date.toLocaleDateString();
    }

    async function approveUser(userId, userName) {
      if (!confirm('Approve ' + userName + '?')) return;

      try {
        const res = await fetch(CONVEX_URL + '/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, adminPassword })
        });
        const data = await res.json();

        if (data.success) {
          showToast(userName + ' approved!');
          document.getElementById('user-' + userId).remove();
          const count = parseInt(document.getElementById('pending-count').textContent) - 1;
          document.getElementById('pending-count').textContent = count;
          if (count === 0) {
            document.getElementById('users-list').innerHTML =
              '<div class="empty-state">no pending applications</div>';
          }
        } else {
          showToast('Error: ' + (data.error || 'unknown error'));
        }
      } catch (e) {
        showToast('Error approving user');
      }
    }

    async function rejectUser(userId, userName) {
      if (!confirm('Reject ' + userName + '? This cannot be undone.')) return;

      try {
        const res = await fetch(CONVEX_URL + '/admin/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, adminPassword })
        });
        const data = await res.json();

        if (data.success) {
          showToast(userName + ' rejected');
          document.getElementById('user-' + userId).remove();
          const count = parseInt(document.getElementById('pending-count').textContent) - 1;
          document.getElementById('pending-count').textContent = count;
          if (count === 0) {
            document.getElementById('users-list').innerHTML =
              '<div class="empty-state">no pending applications</div>';
          }
        } else {
          showToast('Error: ' + (data.error || 'unknown error'));
        }
      } catch (e) {
        showToast('Error rejecting user');
      }
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Auto-refresh every 30 seconds
    setInterval(() => {
      if (adminPassword) loadUsers();
    }, 30000);
  </script>
</body>
</html>
`;

// Serve admin page
http.route({
  path: "/admin",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(getAdminHTML(), {
      headers: { "Content-Type": "text/html" },
    });
  }),
});

// Verify password endpoint
http.route({
  path: "/admin/verify",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const password = url.searchParams.get("password") || "";

    const result = await ctx.runQuery(api.admin.verifyPassword, { password });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Get pending users endpoint
http.route({
  path: "/admin/users",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const users = await ctx.runQuery(api.admin.listPendingUsers);

    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Approve user endpoint
http.route({
  path: "/admin/approve",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { userId, adminPassword } = body;

      const result = await ctx.runMutation(api.admin.approveUser, {
        userId,
        adminPassword,
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }
  }),
});

// Reject user endpoint
http.route({
  path: "/admin/reject",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { userId, adminPassword } = body;

      const result = await ctx.runMutation(api.admin.rejectUser, {
        userId,
        adminPassword,
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }
  }),
});

export default http;

// script.js - Enhanced with Premium Features
(function() {
  "use strict";

  // ========================================
  // CONSTANTS & STATE
  // ========================================
  const USERS_KEY = "users";
  const SESSION_KEY = "session";
  const REMEMBER_KEY = "remember";
  const STUDENTS_KEY = "students";

  const AVAILABLE_COURSES = ['BSIS', 'BSTM', 'BSA', 'BSAIS', 'BSCrim', 'BSE', 'BSN'];

  // DOM refs - Login
  const loginSection = document.getElementById("loginSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const loginForm = document.getElementById("loginForm");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const rememberMe = document.getElementById("rememberMe");
  const togglePassword = document.getElementById("togglePassword");

  // DOM refs - Dashboard
  const tbody = document.getElementById("studentTableBody");
  const emptyMsg = document.getElementById("emptyMessage");
  const totalEl = document.getElementById("totalStudents");
  const activeEl = document.getElementById("activeStudents");
  const inactiveEl = document.getElementById("inactiveStudents");
  const recordCount = document.getElementById("recordCount");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const sortSelect = document.getElementById("sortSelect");
  const refreshBtn = document.getElementById("refreshBtn");
  const modal = new bootstrap.Modal(document.getElementById("studentModal"));
  const restoreModal = new bootstrap.Modal(document.getElementById("restoreModal"));
  const modalTitle = document.getElementById("modalTitle");
  const editId = document.getElementById("editId");
  const studentName = document.getElementById("studentName");
  const studentCourse = document.getElementById("studentCourse");
  const studentStatus = document.getElementById("studentStatus");
  const saveBtn = document.getElementById("saveStudentBtn");
  const addBtn = document.getElementById("addStudentBtn");
  const studentForm = document.getElementById("studentForm");
  const toastEl = document.getElementById("liveToast");
  const toastMessage = document.getElementById("toastMessage");
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  const logoutBtn = document.getElementById("logoutBtn");
  const dateTimeEl = document.getElementById("currentDateTime");

  // New feature buttons
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const backupBtn = document.getElementById("backupBtn");
  const restoreBtn = document.getElementById("restoreBtn");
  const printBtn = document.getElementById("printBtn");
  const restoreFileInput = document.getElementById("restoreFileInput");
  const confirmRestoreBtn = document.getElementById("confirmRestoreBtn");
  const restorePreview = document.getElementById("restorePreview");
  const restorePreviewContent = document.getElementById("restorePreviewContent");

  // Data
  let students = [];
  let restoreData = null;

  // ========================================
  // LIVE CLOCK
  // ========================================
  function updateClock() {
    if (dateTimeEl) {
      const now = new Date();
      const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      };
      dateTimeEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  setInterval(updateClock, 1000);

  // ========================================
  // AUTHENTICATION FUNCTIONS
  // ========================================

  function initUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) {
      const defaultUsers = [
        { username: "admin", password: "admin123" },
        { username: "user", password: "user123" }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
  }

  function isLoggedIn() {
    return localStorage.getItem(SESSION_KEY) === "true";
  }

  function showDashboard() {
    loginSection.style.display = "none";
    dashboardSection.style.display = "block";
    loadStudents();
    render();
    updateClock();
    setTimeout(animateStatistics, 300);
  }

  function showLogin() {
    loginSection.style.display = "block";
    dashboardSection.style.display = "none";
  }

  function logout() {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      showLogin();
      loginPassword.value = "";
      loginForm.classList.remove("was-validated");
      toastEl.classList.remove("bg-success", "bg-danger");
    }
  }

  // ========================================
  // TOAST NOTIFICATION
  // ========================================

  function showToast(msg, isError = false) {
    toastMessage.textContent = msg;
    toastEl.classList.remove("bg-success", "bg-danger");
    toastEl.classList.add(isError ? "bg-danger" : "bg-success");
    toast.show();
  }

  // ========================================
  // ANIMATION HELPERS
  // ========================================

  function animateStatistics() {
    const numbers = document.querySelectorAll('.stat-number');
    numbers.forEach(el => {
      const target = parseInt(el.textContent);
      if (target === 0) return;
      let current = 0;
      const increment = Math.ceil(target / 30);
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = current;
        }
      }, 30);
    });
  }

  // ========================================
  // LOGIN HANDLERS
  // ========================================

  if (togglePassword) {
    togglePassword.addEventListener("click", function() {
      const type = loginPassword.getAttribute("type") === "password" ? "text" : "password";
      loginPassword.setAttribute("type", type);
      this.querySelector("i").classList.toggle("bi-eye");
      this.querySelector("i").classList.toggle("bi-eye-slash");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();

      if (!loginForm.checkValidity()) {
        loginForm.classList.add("was-validated");
        return;
      }

      const username = loginUsername.value.trim();
      const password = loginPassword.value.trim();
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        localStorage.setItem(SESSION_KEY, "true");
        if (rememberMe.checked) {
          localStorage.setItem(REMEMBER_KEY, username);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        showToast("Login successful! 🎉", false);
        setTimeout(() => {
          showDashboard();
        }, 300);
      } else {
        showToast("Invalid username or password! ❌", true);
        loginPassword.value = "";
        loginPassword.focus();
      }
    });
  }

  function loadRemembered() {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered && loginUsername) {
      loginUsername.value = remembered;
      rememberMe.checked = true;
    }
  }

  // ========================================
  // STUDENT MANAGEMENT FUNCTIONS
  // ========================================

  function generateId() {
    if (students.length === 0) return 1;
    const maxId = students.reduce((max, s) => (s.id > max ? s.id : max), 0);
    return maxId + 1;
  }

  function loadStudents() {
    const stored = localStorage.getItem(STUDENTS_KEY);
    if (stored) {
      try {
        students = JSON.parse(stored);
        students = students.filter(s => s.id && s.name && s.course && s.status);
        students = students.map(s => ({ ...s, id: Number(s.id) }));
      } catch (e) {
        students = [];
      }
    }
    if (!students || students.length === 0) {
      students = [
        { id: 1, name: "Juan Dela Cruz", course: "BSIS", status: "Active" },
        { id: 2, name: "Maria Santos", course: "BSTM", status: "Inactive" },
        { id: 3, name: "John Reyes", course: "BSA", status: "Active" },
        { id: 4, name: "Anna Martinez", course: "BSAIS", status: "Active" },
        { id: 5, name: "Robert Tan", course: "BSCrim", status: "Inactive" }
      ];
      saveStudents();
    }
  }

  function saveStudents() {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  }

  function addStudent(name, course, status) {
    if (!AVAILABLE_COURSES.includes(course)) {
      showToast("Invalid course selected!", true);
      return false;
    }
    
    const newStudent = {
      id: generateId(),
      name: name.trim(),
      course: course,
      status: status
    };
    students.push(newStudent);
    saveStudents();
    render();
    showToast("Student added successfully! ✅", false);
    setTimeout(animateStatistics, 300);
    return true;
  }

  function updateStudent(id, name, course, status) {
    if (!AVAILABLE_COURSES.includes(course)) {
      showToast("Invalid course selected!", true);
      return false;
    }
    
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return false;
    students[index] = { id, name: name.trim(), course: course, status };
    saveStudents();
    render();
    showToast("Student updated successfully! ✏️", false);
    return true;
  }

  function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return false;
    students = students.filter(s => s.id !== id);
    saveStudents();
    render();
    showToast("Student deleted successfully! 🗑️", false);
    setTimeout(animateStatistics, 300);
    return true;
  }

  function getFilteredAndSorted() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const statusVal = statusFilter.value;
    const sortKey = sortSelect.value;

    let filtered = students.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchTerm);
      const matchStatus = statusVal === "All" || s.status === statusVal;
      return matchName && matchStatus;
    });

    filtered.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      if (sortKey === 'id') {
        return Number(valA) - Number(valB);
      }
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });
    return filtered;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderStudents() {
    const list = getFilteredAndSorted();
    
    if (recordCount) {
      recordCount.textContent = `${list.length} record${list.length !== 1 ? 's' : ''}`;
    }
    
    if (list.length === 0) {
      tbody.innerHTML = "";
      emptyMsg.classList.remove("d-none");
      return;
    }
    emptyMsg.classList.add("d-none");

    let html = "";
    list.forEach((s, index) => {
      const statusClass = s.status === "Active" ? "bg-success" : "bg-secondary";
      const rowDelay = index * 0.03;
      html += `
        <tr style="animation: slideUp 0.4s ease-out ${rowDelay}s both;">
          <td><span class="fw-bold">${escapeHtml(String(s.id))}</span></td>
          <td><span class="fw-medium">${escapeHtml(s.name)}</span></td>
          <td><span class="badge bg-info text-dark px-3 py-2">${escapeHtml(s.course)}</span></td>
          <td>
            <span class="status-dot ${s.status.toLowerCase()}"></span>
            <span class="badge ${statusClass} badge-status">${s.status}</span>
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-sm-action edit-btn me-1" data-id="${s.id}">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-sm-action delete-btn" data-id="${s.id}">
              <i class="bi bi-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = Number(btn.dataset.id);
        openEditModal(id);
      });
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = Number(btn.dataset.id);
        deleteStudent(id);
      });
    });
  }

  function updateStatistics() {
    const total = students.length;
    const active = students.filter(s => s.status === "Active").length;
    const inactive = students.filter(s => s.status === "Inactive").length;
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (inactiveEl) inactiveEl.textContent = inactive;
  }

  function render() {
    if (!isLoggedIn()) return;
    updateStatistics();
    renderStudents();
  }

  // ========================================
  // MODAL FUNCTIONS
  // ========================================

  function openEditModal(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    modalTitle.innerHTML = `<i class="bi bi-pencil-square me-2 text-primary"></i>Edit Student`;
    editId.value = student.id;
    studentName.value = student.name;
    studentCourse.value = student.course;
    studentStatus.value = student.status;
    modal.show();
  }

  function resetModal() {
    modalTitle.innerHTML = `<i class="bi bi-person-plus me-2 text-primary"></i>Add Student`;
    editId.value = "";
    studentName.value = "";
    studentCourse.value = "";
    studentStatus.value = "Active";
    studentForm.classList.remove("was-validated");
  }

  function handleSave() {
    if (!studentForm.checkValidity()) {
      studentForm.classList.add("was-validated");
      return;
    }
    const name = studentName.value.trim();
    const course = studentCourse.value;
    const status = studentStatus.value;
    const id = editId.value;

    if (!name || !course) {
      studentForm.classList.add("was-validated");
      return;
    }

    if (id) {
      updateStudent(Number(id), name, course, status);
    } else {
      addStudent(name, course, status);
    }
    modal.hide();
    resetModal();
  }

  // ========================================
  // EXPORT CSV
  // ========================================

  function exportCSV() {
    const list = getFilteredAndSorted();
    if (list.length === 0) {
      showToast("No data to export!", true);
      return;
    }

    let csv = "ID,Student Name,Course,Status\n";
    list.forEach(s => {
      csv += `${s.id},"${s.name}","${s.course}","${s.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${list.length} records to CSV! 📊`, false);
  }

  // ========================================
  // BACKUP DATA
  // ========================================

  function backupData() {
    const data = {
      students: students,
      exportDate: new Date().toISOString(),
      version: "1.0",
      totalRecords: students.length
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Backup created with ${students.length} records! 💾`, false);
  }

  // ========================================
  // RESTORE DATA
  // ========================================

  function handleRestoreFile() {
    const file = restoreFileInput.files[0];
    if (!file) {
      showToast("Please select a backup file!", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.students && Array.isArray(data.students)) {
          restoreData = data.students;
          restorePreviewContent.textContent = JSON.stringify(data, null, 2);
          restorePreview.classList.remove('d-none');
          showToast(`Loaded ${restoreData.length} records from backup. Click Restore to confirm.`, false);
        } else {
          showToast("Invalid backup file format!", true);
        }
      } catch (err) {
        showToast("Error reading backup file!", true);
      }
    };
    reader.readAsText(file);
  }

  function confirmRestore() {
    if (!restoreData || restoreData.length === 0) {
      showToast("No data to restore!", true);
      return;
    }

    if (!confirm(`⚠️ This will replace all current data with ${restoreData.length} records from the backup. Are you sure?`)) {
      return;
    }

    students = restoreData.map(s => ({ ...s, id: Number(s.id) }));
    saveStudents();
    render();
    restoreModal.hide();
    restorePreview.classList.add('d-none');
    restoreData = null;
    restoreFileInput.value = '';
    showToast(`Restored ${students.length} records successfully! 🔄`, false);
    setTimeout(animateStatistics, 300);
  }

  // ========================================
  // PRINT REPORT
  // ========================================

  function printReport() {
    const list = getFilteredAndSorted();
    if (list.length === 0) {
      showToast("No data to print!", true);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const total = students.length;
    const active = students.filter(s => s.status === "Active").length;
    const inactive = students.filter(s => s.status === "Inactive").length;

    let tableRows = '';
    list.forEach(s => {
      tableRows += `
        <tr>
          <td>${s.id}</td>
          <td>${s.name}</td>
          <td>${s.course}</td>
          <td><span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-secondary'}">${s.status}</span></td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            background: white;
            color: #1a202c;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 800;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .header .date { 
            color: #6c757d; 
            font-size: 14px;
          }
          .stats { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .stat-box { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center; 
            border-left: 4px solid #667eea;
          }
          .stat-box h3 { 
            font-size: 28px; 
            font-weight: 800; 
            color: #1a202c; 
            margin: 0; 
          }
          .stat-box small { 
            color: #6c757d; 
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          .stat-box.active { border-left-color: #198754; }
          .stat-box.inactive { border-left-color: #6c757d; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          th { 
            background: #667eea; 
            color: white; 
            padding: 14px 16px; 
            text-align: left; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
          }
          td { 
            padding: 12px 16px; 
            border-bottom: 1px solid #f1f3f5; 
            font-size: 14px;
          }
          tr:hover { background: #f8f9fa; }
          tr:last-child td { border-bottom: none; }
          .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
          }
          .badge-success { background: #198754; color: white; }
          .badge-secondary { background: #6c757d; color: white; }
          .badge-info { background: #0dcaf0; color: black; }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 12px; 
            border-top: 1px solid #dee2e6; 
            padding-top: 20px; 
          }
          .no-print { display: none; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>🎓 Student Report</h1>
            <div style="margin-top: 5px; color: #6c757d; font-size: 14px;">
              <i class="bi bi-calendar"></i> Generated: ${new Date().toLocaleString()}
            </div>
          </div>
          <div class="date">
            <button onclick="window.print()" style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>${total}</h3>
            <small>Total Students</small>
          </div>
          <div class="stat-box active">
            <h3 style="color: #198754;">${active}</h3>
            <small>Active</small>
          </div>
          <div class="stat-box inactive">
            <h3 style="color: #6c757d;">${inactive}</h3>
            <small>Inactive</small>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by Student Management System v2.0 • ${list.length} record(s) shown</p>
        </div>

        <script>
          setTimeout(function() { window.print(); }, 500);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ========================================
  // DASHBOARD EVENT LISTENERS
  // ========================================

  function initDashboard() {
    if (!isLoggedIn()) {
      showLogin();
      return;
    }

    showDashboard();

    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(render, 150);
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", render);
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", render);
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        render();
        showToast("Data refreshed! 🔄", false);
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        resetModal();
        modal.show();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", handleSave);
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", exportCSV);
    }

    if (backupBtn) {
      backupBtn.addEventListener("click", backupData);
    }

    if (restoreBtn) {
      restoreBtn.addEventListener("click", () => {
        restorePreview.classList.add('d-none');
        restoreFileInput.value = '';
        restoreData = null;
        restoreModal.show();
      });
    }

    if (restoreFileInput) {
      restoreFileInput.addEventListener("change", handleRestoreFile);
    }

    if (confirmRestoreBtn) {
      confirmRestoreBtn.addEventListener("click", confirmRestore);
    }

    if (printBtn) {
      printBtn.addEventListener("click", printReport);
    }

    document.getElementById("studentModal").addEventListener("hidden.bs.modal", () => {
      resetModal();
    });

    studentName.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } });
    studentCourse.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } });
    studentStatus.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } });
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  function init() {
    initUsers();
    loadRemembered();
    
    if (isLoggedIn()) {
      initDashboard();
    } else {
      showLogin();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
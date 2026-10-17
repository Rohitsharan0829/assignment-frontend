/**
 * ============================================================
 * Student Assignment Management System - Frontend JavaScript
 * Handles API communication, authentication, and UI interactions
 * ============================================================
 */

// --- Configuration ---
const API_BASE_URL = window.STUDENT_ASSIGNMENT_API_BASE_URL || window.APP_CONFIG?.apiBaseUrl || `${window.location.protocol}//${window.location.hostname}:8080/api`;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get the JWT token stored in localStorage.
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Get the currently logged-in user's info from localStorage.
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Save authentication data to localStorage after login/register.
 */
function saveAuthData(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role
    }));
}

/**
 * Clear all auth data (logout).
 */
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * Check if user is authenticated. Redirect to login if not.
 */
function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Check if user has a specific role. Redirect if not authorized.
 */
function requireRole(requiredRole) {
    const user = getCurrentUser();
    if (!user || user.role !== requiredRole) {
        showAlert('You are not authorized to access this page.', 'danger');
        return false;
    }
    return true;
}

/**
 * Make an authenticated API request.
 * Automatically adds the JWT token to the Authorization header.
 */
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = options.headers || {};

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON requests (if body is not FormData)
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: headers
        });

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
            clearAuthData();
            window.location.href = 'login.html';
            return null;
        }

        // Check content type to decide how to parse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'An error occurred');
            }
            return data;
        } else {
            // For file downloads, return the response blob
            if (!response.ok) {
                throw new Error('Failed to download file');
            }
            return response;
        }
    } catch (error) {
        if (error.name === 'TypeError' || (error.message && error.message.includes('fetch')) || (error.message && error.message.includes('NetworkError'))) {
            console.warn('Backend server on port 8080 is offline. Running in interactive demo mode for:', endpoint);
            return handleDemoMockRequest(endpoint, options);
        }
        console.error('API Request Error:', error);
        throw error;
    }
}

// ============================================================
// OFFLINE INTERACTIVE DEMO MODE
// Ensures all logins, dashboard, assignments & uploads work
// smoothly even before Spring Boot is launched on port 8080.
// ============================================================

function initMockData() {
    let users = [
        { id: 1, email: 'faculty@example.com', password: 'password123', fullName: 'Dr. Rahul Sharma', role: 'FACULTY', department: 'Computer Science' },
        { id: 2, email: 'student1@example.com', password: 'password123', fullName: 'Anita Verma', role: 'STUDENT', department: 'Computer Science' },
        { id: 3, email: 'student2@example.com', password: 'password123', fullName: 'Raj Patel', role: 'STUDENT', department: 'Computer Science' },
        { id: 4, email: 'rohit@gmail.com', password: '123456', fullName: 'Rohit Kumar', role: 'STUDENT', department: 'Computer Science' }
    ];

    const savedUsersStr = localStorage.getItem('mock_users');
    if (savedUsersStr) {
        try {
            const existing = JSON.parse(savedUsersStr);
            // Ensure rohit@gmail.com is present even if mock_users was saved previously
            if (!existing.some(u => u.email.toLowerCase() === 'rohit@gmail.com')) {
                existing.push({ id: existing.length + 1, email: 'rohit@gmail.com', password: '123456', fullName: 'Rohit Kumar', role: 'STUDENT', department: 'Computer Science' });
                localStorage.setItem('mock_users', JSON.stringify(existing));
            }
        } catch (e) {
            localStorage.setItem('mock_users', JSON.stringify(users));
        }
    } else {
        localStorage.setItem('mock_users', JSON.stringify(users));
    }

    if (!localStorage.getItem('mock_assignments')) {
        const assignments = [
            {
                id: 1,
                title: 'Java OOP Concepts',
                description: 'Write a program demonstrating all four pillars of OOP: Encapsulation, Inheritance, Polymorphism, and Abstraction.',
                subject: 'Java Programming',
                maxMarks: 100,
                deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
                createdBy: 1,
                createdByName: 'Dr. Rahul Sharma'
            },
            {
                id: 2,
                title: 'SQL Database Design',
                description: 'Design a normalized database schema for a library management system with ER diagram and CREATE TABLE statements.',
                subject: 'Database Management',
                maxMarks: 50,
                deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
                createdBy: 1,
                createdByName: 'Dr. Rahul Sharma'
            },
            {
                id: 3,
                title: 'HTML CSS Portfolio',
                description: 'Create a personal responsive portfolio website using HTML5 and CSS3. Must contain at least 3 pages: Home, About, and Contact.',
                subject: 'Web Development',
                maxMarks: 75,
                deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
                createdBy: 1,
                createdByName: 'Dr. Rahul Sharma'
            }
        ];
        localStorage.setItem('mock_assignments', JSON.stringify(assignments));
    }

    if (!localStorage.getItem('mock_submissions')) {
        const submissions = [
            {
                id: 1,
                assignmentId: 1,
                assignmentTitle: 'Java OOP Concepts',
                studentId: 4,
                studentName: 'Rohit Kumar',
                studentEmail: 'rohit@gmail.com',
                fileName: 'Rohit_OOP_Assignment.pdf',
                submittedAt: new Date(Date.now() - 86400000).toISOString(),
                status: 'GRADED',
                marks: 96,
                feedback: 'Outstanding implementation of interfaces and classes!'
            },
            {
                id: 2,
                assignmentId: 3,
                assignmentTitle: 'HTML CSS Portfolio',
                studentId: 4,
                studentName: 'Rohit Kumar',
                studentEmail: 'rohit@gmail.com',
                fileName: 'Portfolio_Website.zip',
                submittedAt: new Date().toISOString(),
                status: 'SUBMITTED',
                marks: null,
                feedback: null
            }
        ];
        localStorage.setItem('mock_submissions', JSON.stringify(submissions));
    }
}

function showDemoBanner() {
    if (document.getElementById('demoModeBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'demoModeBanner';
    banner.innerHTML = `
        <div style="position:fixed;bottom:16px;right:16px;z-index:99999;background:#0f172a;color:#f8fafc;padding:12px 18px;border-radius:10px;box-shadow:0 12px 28px rgba(0,0,0,0.25);display:flex;align-items:center;gap:12px;font-size:13px;border-left:4px solid #3b82f6;font-family:inherit;">
            <i class="bi bi-hdd-network" style="color:#60a5fa;font-size:18px;"></i>
            <div>
                <strong>Interactive Demo:</strong> Backend port 8080 offline. All logins, submissions & grading work in browser storage!
            </div>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 4px;margin-left:6px;">&times;</button>
        </div>
    `;
    document.body.appendChild(banner);
}

function handleDemoMockRequest(endpoint, options = {}) {
    initMockData();
    showDemoBanner();

    const method = (options.method || 'GET').toUpperCase();
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    let assignments = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
    let submissions = JSON.parse(localStorage.getItem('mock_submissions') || '[]');
    const currentUser = getCurrentUser();

    // 1. POST /auth/login - Any email and password allowed!
    if (endpoint === '/auth/login' && method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const email = (body.email || '').trim();
        const password = (body.password || '').trim();

        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            const isFaculty = /faculty|teacher|admin|prof/i.test(email);
            const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Student User';
            user = {
                id: users.length + 1,
                email: email,
                password: password,
                fullName: nameFromEmail,
                role: isFaculty ? 'FACULTY' : 'STUDENT',
                department: 'Computer Science'
            };
            users.push(user);
            localStorage.setItem('mock_users', JSON.stringify(users));
        }

        return {
            token: 'demo_token_' + Date.now(),
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };
    }

    // 2. POST /auth/register
    if (endpoint === '/auth/register' && method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        if (users.some(u => u.email.toLowerCase() === (body.email || '').trim().toLowerCase())) {
            throw new Error('Email is already registered');
        }
        const newUser = {
            id: users.length + 1,
            email: body.email.trim(),
            password: body.password.trim(),
            fullName: body.fullName.trim(),
            role: body.role || 'STUDENT',
            department: body.department || 'Computer Science'
        };
        users.push(newUser);
        localStorage.setItem('mock_users', JSON.stringify(users));
        return {
            token: 'demo_token_' + Date.now(),
            userId: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role
        };
    }

    // 3. GET /assignments
    if (endpoint.startsWith('/assignments') && method === 'GET') {
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
        const subject = urlParams.get('subject');
        const search = urlParams.get('search');
        let filtered = [...assignments];
        if (subject) filtered = filtered.filter(a => a.subject === subject);
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
        }
        return filtered;
    }

    // 4. POST /assignments (Faculty create)
    if (endpoint === '/assignments' && method === 'POST') {
        let title, description, subject, maxMarks, deadline;
        if (options.body instanceof FormData) {
            title = options.body.get('title');
            description = options.body.get('description');
            subject = options.body.get('subject');
            maxMarks = parseInt(options.body.get('maxMarks') || '100');
            deadline = options.body.get('deadline');
        } else {
            const body = JSON.parse(options.body || '{}');
            title = body.title;
            description = body.description;
            subject = body.subject;
            maxMarks = body.maxMarks || 100;
            deadline = body.deadline;
        }
        const newA = {
            id: assignments.length + 1,
            title,
            description,
            subject,
            maxMarks,
            deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
            createdBy: currentUser ? currentUser.userId : 1,
            createdByName: currentUser ? currentUser.fullName : 'Faculty'
        };
        assignments.push(newA);
        localStorage.setItem('mock_assignments', JSON.stringify(assignments));
        return newA;
    }

    // 5. GET /submissions/my (Student view)
    if (endpoint === '/submissions/my' && method === 'GET') {
        const studentId = currentUser ? currentUser.userId : 4;
        return submissions.filter(s => s.studentId === studentId);
    }

    // 6. POST /submissions (Student submit)
    if (endpoint === '/submissions' && method === 'POST') {
        let assignmentId, fileName = 'submission_file.pdf';
        if (options.body instanceof FormData) {
            assignmentId = parseInt(options.body.get('assignmentId'));
            const file = options.body.get('file');
            if (file && file.name) fileName = file.name;
        }
        const targetA = assignments.find(a => a.id === assignmentId) || { title: 'Assignment #' + assignmentId };
        const newSub = {
            id: submissions.length + 1,
            assignmentId,
            assignmentTitle: targetA.title,
            studentId: currentUser ? currentUser.userId : 4,
            studentName: currentUser ? currentUser.fullName : 'Rohit Kumar',
            studentEmail: currentUser ? currentUser.email : 'rohit@gmail.com',
            fileName,
            submittedAt: new Date().toISOString(),
            status: 'SUBMITTED',
            marks: null,
            feedback: null
        };
        submissions = submissions.filter(s => !(s.assignmentId === assignmentId && s.studentId === newSub.studentId));
        submissions.push(newSub);
        localStorage.setItem('mock_submissions', JSON.stringify(submissions));
        return newSub;
    }

    // 7. GET /submissions/assignment/{id}
    if (endpoint.startsWith('/submissions/assignment/') && method === 'GET') {
        const id = parseInt(endpoint.split('/').pop());
        return submissions.filter(s => s.assignmentId === id);
    }

    // 8. POST /submissions/{id}/grade
    if (endpoint.includes('/grade') && method === 'POST') {
        const parts = endpoint.split('/');
        const id = parseInt(parts[2]);
        const body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : {};
        const sub = submissions.find(s => s.id === id);
        if (sub) {
            sub.marks = body.marks;
            sub.feedback = body.feedback;
            sub.status = 'GRADED';
            localStorage.setItem('mock_submissions', JSON.stringify(submissions));
        }
        return { success: true, submission: sub };
    }

    return { success: true };
}

/**
 * Show an alert message on the page.
 */
function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const icons = {
        success: 'bi-check-circle-fill',
        danger: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
    };

    container.innerHTML = `
        <div class="alert alert-${type}">
            <i class="bi ${icons[type] || icons.info}"></i>
            <span>${message}</span>
            <button class="close-alert" onclick="this.parentElement.remove()">&times;</button>
        </div>
    `;

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) alert.remove();
    }, 5000);
}

/**
 * Format a date string to a readable format.
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format a date for datetime-local input.
 */
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
}

/**
 * Get remaining time until deadline.
 */
function getDeadlineStatus(deadlineStr) {
    if (!deadlineStr) return { text: 'No deadline', class: 'safe' };
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diff = deadline - now;

    if (diff < 0) {
        return { text: 'Expired', class: 'expired' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 3) {
        return { text: `${days} days left`, class: 'safe' };
    } else if (days > 0) {
        return { text: `${days}d ${hours}h left`, class: 'upcoming' };
    } else {
        return { text: `${hours}h left`, class: 'upcoming' };
    }
}

/**
 * Get status badge HTML.
 */
function getStatusBadge(status) {
    const badges = {
        'SUBMITTED': '<span class="badge badge-submitted">Submitted</span>',
        'GRADED': '<span class="badge badge-graded">Graded</span>',
        'LATE': '<span class="badge badge-late">Late</span>'
    };
    return badges[status] || `<span class="badge badge-pending">${status}</span>`;
}

/**
 * Set up the navigation sidebar based on user role.
 */
function setupNavigation() {
    const user = getCurrentUser();
    if (!user) return;

    // Set user name in navbar
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    if (userName) userName.textContent = user.fullName;
    if (userAvatar) userAvatar.textContent = user.fullName.charAt(0).toUpperCase();

    // Show/hide nav links based on role
    const studentNav = document.querySelectorAll('.student-only');
    const facultyNav = document.querySelectorAll('.faculty-only');

    if (user.role === 'STUDENT') {
        studentNav.forEach(el => el.style.display = '');
        facultyNav.forEach(el => el.style.display = 'none');
    } else {
        studentNav.forEach(el => el.style.display = 'none');
        facultyNav.forEach(el => el.style.display = '');
    }

    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

/**
 * Logout function - clears data and redirects to login.
 */
function logout() {
    clearAuthData();
    window.location.href = 'login.html';
}

/**
 * Download a file from the server.
 */
async function downloadFile(url, defaultName) {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition');
        let filename = defaultName || 'download';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+?)"?$/);
            if (match) filename = match[1];
        }

        // Create a download link and click it
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        showAlert('Failed to download file: ' + error.message, 'danger');
    }
}


// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

/**
 * Handle user registration form submission.
 */
async function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value.trim();

    // Client-side validation
    if (!fullName || !email || !password || !role) {
        showAlert('Please fill in all required fields.', 'danger');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match.', 'danger');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'danger');
        return;
    }

    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ fullName, email, password, role, department })
        });

        saveAuthData(data);
        showAlert('Registration successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = data.role === 'FACULTY' ?
                'student-dashboard.html' : 'student-dashboard.html';
        }, 1000);
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

/**
 * Handle user login form submission.
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAlert('Please enter your email and password.', 'danger');
        return;
    }

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data && data.token) {
            saveAuthData(data);
            showAlert('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'student-dashboard.html';
            }, 800);
            return;
        }
    } catch (error) {
        showAlert(error.message || 'Unable to sign in.', 'danger');
    }
}


// ============================================================
// DASHBOARD FUNCTIONS
// ============================================================

/**
 * Load dashboard data for the current user.
 */
async function loadDashboard() {
    if (!requireAuth()) return;
    setupNavigation();

    const user = getCurrentUser();

    try {
        if (user.role === 'STUDENT') {
            await loadStudentDashboard();
        } else {
            await loadFacultyDashboard();
        }
    } catch (error) {
        showAlert('Failed to load dashboard: ' + error.message, 'danger');
    }
}

/**
 * Load student-specific dashboard data.
 */
async function loadStudentDashboard() {
    // Load dashboard stats
    try {
        const statsResponse = await apiRequest('/submissions/dashboard');
        if (statsResponse && statsResponse.data) {
            const stats = statsResponse.data;
            updateStatCard('totalSubmissions', stats.totalSubmissions || 0);
            updateStatCard('pendingReview', stats.pendingReview || 0);
            updateStatCard('gradedCount', stats.graded || 0);
            updateStatCard('lateCount', stats.late || 0);
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }

    // Load recent assignments for upcoming deadlines
    try {
        const assignmentsResponse = await apiRequest('/assignments');
        if (assignmentsResponse && assignmentsResponse.data) {
            displayUpcomingDeadlines(assignmentsResponse.data);
        }
    } catch (e) {
        console.error('Failed to load assignments:', e);
    }

    // Load recent submissions
    try {
        const submissionsResponse = await apiRequest('/submissions/my');
        if (submissionsResponse && submissionsResponse.data) {
            displayRecentSubmissions(submissionsResponse.data);
        }
    } catch (e) {
        console.error('Failed to load submissions:', e);
    }
}

/**
 * Load faculty-specific dashboard data.
 */
async function loadFacultyDashboard() {
    // Load faculty's assignments
    try {
        const assignmentsResponse = await apiRequest('/assignments/faculty');
        if (assignmentsResponse && assignmentsResponse.data) {
            const assignments = assignmentsResponse.data;
            updateStatCard('totalSubmissions', assignments.length);

            // Count active assignments (not expired)
            const active = assignments.filter(a => !a.isExpired).length;
            const expired = assignments.filter(a => a.isExpired).length;
            updateStatCard('pendingReview', active);
            updateStatCard('gradedCount', expired);
            updateStatCard('lateCount', 0);

            displayUpcomingDeadlines(assignments);
            displayFacultyAssignmentsList(assignments);
        }
    } catch (e) {
        console.error('Failed to load assignments:', e);
    }
}

/**
 * Update a stat card value.
 */
function updateStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/**
 * Display upcoming deadlines in the dashboard.
 */
function displayUpcomingDeadlines(assignments) {
    const container = document.getElementById('upcomingDeadlines');
    if (!container) return;

    // Filter upcoming (not expired) and sort by deadline
    const upcoming = assignments
        .filter(a => !a.isExpired)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-check"></i>
                <h3>No Upcoming Deadlines</h3>
                <p>All deadlines have passed or no assignments are available.</p>
            </div>`;
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Assignment</th><th>Subject</th><th>Deadline</th><th>Status</th></tr></thead><tbody>';

    upcoming.forEach(a => {
        const status = getDeadlineStatus(a.deadline);
        html += `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td>${a.subject}</td>
                <td>${formatDate(a.deadline)}</td>
                <td><span class="deadline-display ${status.class}"><i class="bi bi-clock"></i> ${status.text}</span></td>
            </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Display recent submissions in the student dashboard.
 */
function displayRecentSubmissions(submissions) {
    const container = document.getElementById('recentSubmissions');
    if (!container) return;

    if (submissions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-arrow-up"></i>
                <h3>No Submissions Yet</h3>
                <p>Submit your first assignment to see it here.</p>
            </div>`;
        return;
    }

    const recent = submissions.slice(0, 5);
    let html = '<table class="data-table"><thead><tr><th>Assignment</th><th>Submitted</th><th>Status</th><th>Marks</th></tr></thead><tbody>';

    recent.forEach(s => {
        html += `
            <tr>
                <td><strong>${s.assignmentTitle}</strong></td>
                <td>${formatDate(s.submittedAt)}</td>
                <td>${getStatusBadge(s.status)}</td>
                <td>${s.marks !== null ? s.marks + '/' + s.maxMarks : '-'}</td>
            </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Display faculty's assignments list on the dashboard.
 */
function displayFacultyAssignmentsList(assignments) {
    const container = document.getElementById('recentSubmissions');
    if (!container) return;

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-plus"></i>
                <h3>No Assignments Created</h3>
                <p>Create your first assignment to get started.</p>
            </div>`;
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Title</th><th>Subject</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>';

    assignments.forEach(a => {
        html += `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td>${a.subject}</td>
                <td>${formatDate(a.deadline)}</td>
                <td>
                    <a href="assignments.html?view=${a.id}" class="btn btn-sm btn-outline">
                        <i class="bi bi-eye"></i> View
                    </a>
                </td>
            </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}


// ============================================================
// ASSIGNMENTS FUNCTIONS
// ============================================================

/**
 * Load all assignments with optional search filter.
 */
async function loadAssignments() {
    if (!requireAuth()) return;
    setupNavigation();

    const user = getCurrentUser();
    const searchInput = document.getElementById('searchSubject');

    // Check for ?view=ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');

    if (viewId) {
        await loadAssignmentDetail(viewId);
        return;
    }

    try {
        let endpoint = '/assignments';
        if (searchInput && searchInput.value.trim()) {
            endpoint += `?subject=${encodeURIComponent(searchInput.value.trim())}`;
        }

        const response = await apiRequest(endpoint);
        if (response && response.data) {
            displayAssignments(response.data, user.role);
        }
    } catch (error) {
        showAlert('Failed to load assignments: ' + error.message, 'danger');
    }
}

/**
 * Display assignments as cards.
 */
function displayAssignments(assignments, role) {
    const container = document.getElementById('assignmentsContainer');
    if (!container) return;

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-x"></i>
                <h3>No Assignments Found</h3>
                <p>Try adjusting your search or check back later.</p>
            </div>`;
        return;
    }

    let html = '';
    assignments.forEach(a => {
        const deadlineStatus = getDeadlineStatus(a.deadline);
        const statusBadge = a.isExpired ?
            '<span class="badge badge-expired">Expired</span>' :
            '<span class="badge badge-active">Active</span>';

        html += `
            <div class="assignment-card">
                <div class="card-top">
                    <span class="subject-tag">${a.subject}</span>
                    ${statusBadge}
                    <h3>${a.title}</h3>
                    <p>${a.description || 'No description available.'}</p>
                </div>
                <div class="card-meta">
                    <div class="meta-item">
                        <i class="bi bi-trophy"></i> Max: ${a.maxMarks} marks
                    </div>
                    <div class="meta-item">
                        <i class="bi bi-calendar-event"></i> ${formatDate(a.deadline)}
                    </div>
                    <div class="meta-item deadline-display ${deadlineStatus.class}">
                        <i class="bi bi-clock"></i> ${deadlineStatus.text}
                    </div>
                    <div class="meta-item">
                        <i class="bi bi-person"></i> ${a.createdByName || 'Faculty'}
                    </div>
                </div>
                <div class="card-actions">
                    ${a.hasInstructionFile ? `
                        <button class="btn btn-sm btn-outline" onclick="downloadFile('/assignments/${a.id}/download', '${a.instructionFileName}')">
                            <i class="bi bi-download"></i> Instructions
                        </button>` : ''}
                    ${role === 'STUDENT' && !a.isExpired ? `
                        <a href="upload-assignment.html?id=${a.id}" class="btn btn-sm btn-primary">
                            <i class="bi bi-upload"></i> Submit
                        </a>` : ''}
                    ${role === 'FACULTY' ? `
                        <button class="btn btn-sm btn-outline" onclick="viewSubmissions(${a.id})">
                            <i class="bi bi-people"></i> Submissions
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="editAssignment(${a.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${a.id})">
                            <i class="bi bi-trash"></i>
                        </button>` : ''}
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

/**
 * Load a single assignment's details.
 */
async function loadAssignmentDetail(id) {
    try {
        const response = await apiRequest(`/assignments/${id}`);
        if (response && response.data) {
            // Show detail view
            const container = document.getElementById('assignmentsContainer');
            if (container) {
                const a = response.data;
                container.innerHTML = `
                    <div class="content-card" style="max-width:800px;">
                        <div class="card-header">
                            <h2>${a.title}</h2>
                            <a href="assignments.html" class="btn btn-sm btn-outline"><i class="bi bi-arrow-left"></i> Back</a>
                        </div>
                        <div class="card-body">
                            <p><strong>Subject:</strong> ${a.subject}</p>
                            <p><strong>Max Marks:</strong> ${a.maxMarks}</p>
                            <p><strong>Deadline:</strong> ${formatDate(a.deadline)}</p>
                            <p><strong>Created By:</strong> ${a.createdByName || 'Faculty'}</p>
                            <hr style="margin:1rem 0;border-color:var(--gray-200);">
                            <p><strong>Description:</strong></p>
                            <p>${a.description || 'No description provided.'}</p>
                            ${a.hasInstructionFile ? `
                                <div class="mt-2">
                                    <button class="btn btn-primary" onclick="downloadFile('/assignments/${a.id}/download', '${a.instructionFileName}')">
                                        <i class="bi bi-download"></i> Download Instructions
                                    </button>
                                </div>` : ''}
                        </div>
                    </div>`;
            }
        }
    } catch (error) {
        showAlert('Failed to load assignment: ' + error.message, 'danger');
    }
}

/**
 * Search assignments by subject.
 */
function searchAssignments() {
    loadAssignments();
}

/**
 * Delete an assignment (Faculty only).
 */
async function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) return;

    try {
        await apiRequest(`/assignments/${id}`, { method: 'DELETE' });
        showAlert('Assignment deleted successfully.', 'success');
        loadAssignments();
    } catch (error) {
        showAlert('Failed to delete: ' + error.message, 'danger');
    }
}

/**
 * Open edit modal for an assignment (Faculty).
 */
async function editAssignment(id) {
    try {
        const response = await apiRequest(`/assignments/${id}`);
        if (response && response.data) {
            const a = response.data;
            document.getElementById('editAssignmentId').value = a.id;
            document.getElementById('editTitle').value = a.title;
            document.getElementById('editDescription').value = a.description || '';
            document.getElementById('editSubject').value = a.subject;
            document.getElementById('editMaxMarks').value = a.maxMarks;
            document.getElementById('editDeadline').value = formatDateForInput(a.deadline);

            document.getElementById('editModal').classList.add('active');
        }
    } catch (error) {
        showAlert('Failed to load assignment for editing: ' + error.message, 'danger');
    }
}

/**
 * Save edited assignment.
 */
async function saveEditAssignment(event) {
    event.preventDefault();
    const id = document.getElementById('editAssignmentId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('editTitle').value);
    formData.append('description', document.getElementById('editDescription').value);
    formData.append('subject', document.getElementById('editSubject').value);
    formData.append('maxMarks', document.getElementById('editMaxMarks').value);
    formData.append('deadline', document.getElementById('editDeadline').value + ':00');

    const fileInput = document.getElementById('editFile');
    if (fileInput && fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }

    try {
        await apiRequest(`/assignments/${id}`, {
            method: 'PUT',
            body: formData
        });
        closeModal('editModal');
        showAlert('Assignment updated successfully.', 'success');
        loadAssignments();
    } catch (error) {
        showAlert('Failed to update: ' + error.message, 'danger');
    }
}

/**
 * View submissions for an assignment (Faculty).
 */
async function viewSubmissions(assignmentId) {
    try {
        const response = await apiRequest(`/submissions/assignment/${assignmentId}`);
        if (response && response.data) {
            showSubmissionsModal(response.data, assignmentId);
        }
    } catch (error) {
        showAlert('Failed to load submissions: ' + error.message, 'danger');
    }
}

/**
 * Show submissions in a modal.
 */
function showSubmissionsModal(submissions, assignmentId) {
    const modal = document.getElementById('submissionsModal');
    const body = document.getElementById('submissionsModalBody');
    if (!modal || !body) return;

    if (submissions.length === 0) {
        body.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <h3>No Submissions</h3>
                <p>No students have submitted this assignment yet.</p>
            </div>`;
    } else {
        let html = '<table class="data-table"><thead><tr><th>Student</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Actions</th></tr></thead><tbody>';

        submissions.forEach(s => {
            html += `
                <tr>
                    <td>
                        <strong>${s.studentName}</strong><br>
                        <small class="text-muted">${s.studentEmail}</small>
                    </td>
                    <td>${formatDate(s.submittedAt)}</td>
                    <td>${getStatusBadge(s.status)}</td>
                    <td>${s.marks !== null ? s.marks + '/' + s.maxMarks : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="downloadFile('/submissions/${s.id}/download', '${s.fileName}')">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="openGradeForm(${s.id}, ${s.maxMarks}, ${s.marks !== null ? s.marks : 'null'}, '${(s.feedback || '').replace(/'/g, "\\'")}')">
                            <i class="bi bi-pencil-square"></i> Grade
                        </button>
                    </td>
                </tr>`;
        });

        html += '</tbody></table>';
        body.innerHTML = html;
    }

    modal.classList.add('active');
}

/**
 * Open grading form for a submission.
 */
function openGradeForm(submissionId, maxMarks, currentMarks, currentFeedback) {
    const modal = document.getElementById('gradeModal');
    if (!modal) return;

    document.getElementById('gradeSubmissionId').value = submissionId;
    document.getElementById('gradeMaxMarks').textContent = maxMarks;
    document.getElementById('gradeMarks').value = currentMarks !== null && currentMarks !== 'null' ? currentMarks : '';
    document.getElementById('gradeMarks').max = maxMarks;
    document.getElementById('gradeFeedback').value = currentFeedback !== 'null' ? currentFeedback : '';

    modal.classList.add('active');
}

/**
 * Submit grade for a submission.
 */
async function submitGrade(event) {
    event.preventDefault();
    const submissionId = document.getElementById('gradeSubmissionId').value;
    const marks = document.getElementById('gradeMarks').value;
    const feedback = document.getElementById('gradeFeedback').value;

    if (marks === '' || marks === null) {
        showAlert('Please enter marks.', 'danger');
        return;
    }

    try {
        await apiRequest(`/submissions/grade/${submissionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                marks: parseInt(marks),
                feedback: feedback
            })
        });

        closeModal('gradeModal');
        showAlert('Submission graded successfully!', 'success');

        // Refresh the submissions modal if still open
        const urlParams = new URLSearchParams(window.location.search);
        loadAssignments();
    } catch (error) {
        showAlert('Failed to grade: ' + error.message, 'danger');
    }
}


// ============================================================
// SUBMISSION / UPLOAD FUNCTIONS
// ============================================================

/**
 * Initialize the upload assignment page.
 */
async function initUploadPage() {
    if (!requireAuth()) return;
    setupNavigation();

    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');

    if (assignmentId) {
        // Pre-select the assignment
        document.getElementById('assignmentId').value = assignmentId;

        // Load assignment details
        try {
            const response = await apiRequest(`/assignments/${assignmentId}`);
            if (response && response.data) {
                const a = response.data;
                const detailsDiv = document.getElementById('assignmentDetails');
                if (detailsDiv) {
                    detailsDiv.innerHTML = `
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle-fill"></i>
                            <span>Submitting for: <strong>${a.title}</strong> (${a.subject}) — Deadline: ${formatDate(a.deadline)}</span>
                        </div>`;
                }
            }
        } catch (e) {
            console.error('Could not load assignment details:', e);
        }
    }

    // Also load the assignment dropdown
    await loadAssignmentDropdown();

    // Set up file input display
    setupFileInput();
}

/**
 * Load assignment options for the dropdown in upload page.
 */
async function loadAssignmentDropdown() {
    try {
        const response = await apiRequest('/assignments');
        if (response && response.data) {
            const select = document.getElementById('assignmentId');
            if (!select) return;

            const currentValue = select.value;

            // Keep the default option
            select.innerHTML = '<option value="">-- Select Assignment --</option>';

            response.data.forEach(a => {
                if (!a.isExpired) {
                    const option = document.createElement('option');
                    option.value = a.id;
                    option.textContent = `${a.title} (${a.subject})`;
                    select.appendChild(option);
                }
            });

            // Re-select if we had a value
            if (currentValue) {
                select.value = currentValue;
            }
        }
    } catch (e) {
        console.error('Failed to load assignment dropdown:', e);
    }
}

/**
 * Set up the file input drag-and-drop area.
 */
function setupFileInput() {
    const fileArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('submissionFile');
    const fileNameDisplay = document.getElementById('selectedFileName');

    if (!fileArea || !fileInput) return;

    fileArea.addEventListener('click', () => fileInput.click());

    fileArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileArea.style.borderColor = 'var(--primary)';
        fileArea.style.background = 'var(--primary-bg)';
    });

    fileArea.addEventListener('dragleave', () => {
        fileArea.style.borderColor = '';
        fileArea.style.background = '';
    });

    fileArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileArea.style.borderColor = '';
        fileArea.style.background = '';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            if (fileNameDisplay) {
                fileNameDisplay.textContent = e.dataTransfer.files[0].name;
                fileNameDisplay.style.display = 'block';
            }
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0 && fileNameDisplay) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            fileNameDisplay.style.display = 'block';
        }
    });
}

/**
 * Handle assignment submission form.
 */
async function handleSubmitAssignment(event) {
    event.preventDefault();

    const assignmentId = document.getElementById('assignmentId').value;
    const fileInput = document.getElementById('submissionFile');

    if (!assignmentId) {
        showAlert('Please select an assignment.', 'danger');
        return;
    }

    if (!fileInput.files.length) {
        showAlert('Please select a file to upload.', 'danger');
        return;
    }

    const file = fileInput.files[0];
    const allowedTypes = ['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'];

    if (!allowedTypes.includes(file.type)) {
        showAlert('Invalid file type. Please upload a PDF or DOCX file.', 'danger');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showAlert('File size exceeds 10 MB limit.', 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('file', file);

    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Uploading...';
        }

        await apiRequest('/submissions/upload', {
            method: 'POST',
            body: formData
        });

        showAlert('Assignment submitted successfully!', 'success');

        // Reset form
        event.target.reset();
        const fileNameDisplay = document.getElementById('selectedFileName');
        if (fileNameDisplay) fileNameDisplay.style.display = 'none';

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-upload"></i> Submit Assignment';
        }
    } catch (error) {
        showAlert(error.message, 'danger');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-upload"></i> Submit Assignment';
        }
    }
}


// ============================================================
// FACULTY - CREATE ASSIGNMENT FUNCTIONS
// ============================================================

/**
 * Handle create assignment form submission (Faculty only).
 */
async function handleCreateAssignment(event) {
    event.preventDefault();

    const title = document.getElementById('createTitle').value.trim();
    const description = document.getElementById('createDescription').value.trim();
    const subject = document.getElementById('createSubject').value.trim();
    const maxMarks = document.getElementById('createMaxMarks').value;
    const deadline = document.getElementById('createDeadline').value;
    const fileInput = document.getElementById('createFile');

    if (!title || !subject || !deadline) {
        showAlert('Please fill in all required fields.', 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('maxMarks', maxMarks || 100);
    formData.append('deadline', deadline + ':00');

    if (fileInput && fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }

    try {
        await apiRequest('/assignments/create', {
            method: 'POST',
            body: formData
        });

        showAlert('Assignment created successfully!', 'success');
        event.target.reset();

        // Redirect to assignments page after a brief delay
        setTimeout(() => {
            window.location.href = 'assignments.html';
        }, 1500);
    } catch (error) {
        showAlert('Failed to create assignment: ' + error.message, 'danger');
    }
}


// ============================================================
// SUBMISSION HISTORY
// ============================================================

/**
 * Load submission history for the current student.
 */
async function loadSubmissionHistory() {
    if (!requireAuth()) return;
    setupNavigation();

    const user = getCurrentUser();

    try {
        let response;
        if (user.role === 'STUDENT') {
            response = await apiRequest('/submissions/my');
        } else {
            // Faculty can see all - but we'll load from faculty's assignments
            response = await apiRequest('/assignments/faculty');
            if (response && response.data) {
                displayFacultySubmissionsView(response.data);
                return;
            }
        }

        if (response && response.data) {
            displaySubmissionHistory(response.data);
        }
    } catch (error) {
        showAlert('Failed to load submissions: ' + error.message, 'danger');
    }
}

/**
 * Display submission history table for students.
 */
function displaySubmissionHistory(submissions) {
    const container = document.getElementById('submissionHistoryContainer');
    if (!container) return;

    if (submissions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-x"></i>
                <h3>No Submissions Yet</h3>
                <p>You haven't submitted any assignments yet. Go to the Assignments page to get started.</p>
            </div>`;
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Assignment</th><th>Subject</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Feedback</th><th>Actions</th></tr></thead><tbody>';

    submissions.forEach(s => {
        html += `
            <tr>
                <td><strong>${s.assignmentTitle}</strong></td>
                <td>${s.assignmentSubject}</td>
                <td>${formatDate(s.submittedAt)}</td>
                <td>${getStatusBadge(s.status)}</td>
                <td>${s.marks !== null ? `<strong>${s.marks}/${s.maxMarks}</strong>` : '-'}</td>
                <td>
                    ${s.feedback ? `
                        <div class="feedback-display">
                            <div class="feedback-label">Faculty Feedback</div>
                            <div class="feedback-text">${s.feedback}</div>
                        </div>` : '<span class="text-muted">No feedback yet</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="downloadFile('/submissions/${s.id}/download', '${s.fileName}')">
                        <i class="bi bi-download"></i>
                    </button>
                </td>
            </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Display faculty's view of all their assignments and a way to see submissions.
 */
function displayFacultySubmissionsView(assignments) {
    const container = document.getElementById('submissionHistoryContainer');
    if (!container) return;

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-x"></i>
                <h3>No Assignments Created</h3>
                <p>Create assignments first to see student submissions.</p>
            </div>`;
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Assignment</th><th>Subject</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>';

    assignments.forEach(a => {
        html += `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td>${a.subject}</td>
                <td>${formatDate(a.deadline)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewSubmissions(${a.id})">
                        <i class="bi bi-people"></i> View Submissions
                    </button>
                </td>
            </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}


// ============================================================
// MODAL HELPERS
// ============================================================

/**
 * Close a modal by its ID.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

/**
 * Auto-initialize based on the current page.
 */
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    switch (currentPage) {
        case 'student-dashboard.html':
            loadDashboard();
            break;
        case 'assignments.html':
            loadAssignments();
            break;
        case 'upload-assignment.html':
            initUploadPage();
            break;
        default:
            // Landing or auth pages don't need initialization
            break;
    }
});

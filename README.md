# Student Assignment Management System - Frontend 🎓💻

Client-side web portal for the Student Assignment Management System. Built with HTML5, CSS3, JavaScript, and Bootstrap 5.3.

---

## 🚀 Features

- **Landing Page (`index.html`)**: Overview of the platform with feature cards.
- **Authentication (`login.html`)**: Login and registration with role switching (Student & Faculty) and validation.
- **Dashboard (`student-dashboard.html`)**: Dynamic overview showing summary stat cards, upcoming assignment deadlines, and recent activities.
- **Assignments (`assignments.html`)**: Complete assignment catalog with search, subject filters, and modal dialogs (create/edit for faculty, submit for students).
- **Upload (`upload-assignment.html`)**: Drag-and-drop submission uploader with submission history and status tracking.
- **Universal Interactive Demo Mode**: Works immediately in any browser with interactive mock storage even when backend is offline!

---

## 🛠️ Tech Stack

- **HTML5 & CSS3** (Custom responsive design with modern cards, glassmorphic accents, and micro-animations)
- **Vanilla JavaScript** (ES6+ modular API client, JWT authentication token handling, toast alerts)
- **Bootstrap 5.3 & Bootstrap Icons**

---

## 🏃 How to Run Locally

1. Open `index.html` directly in any web browser.
2. Or serve via VS Code **Live Server** / Node.js http server on `http://localhost:3000`.

---

## 🔗 Backend Integration

- Configured to connect to Spring Boot REST API at `http://localhost:8080/api`.
- When the backend is offline, the portal automatically operates in interactive demo mode using browser storage.

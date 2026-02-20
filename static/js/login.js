document.addEventListener('DOMContentLoaded', function() {
    // Theme Switching Functionality
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    // Theme toggle event
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Language Switching Functionality
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            langButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            showToast(`Langue changée en ${this.textContent}`);
        });
    });
    
    // Login Form Submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (!email || !password) {
            showToast('Veuillez remplir tous les champs', 'error');
            return;
        }
        
        // Login process
        const loginBtn = this.querySelector('button[type="submit"]');
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        loginBtn.disabled = true;
        
        try {
            // API call to login
            const response = await fetch('http://127.0.0.1:8000/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',  // أضف هذا السطر

                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save tokens and user data
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showToast('Connexion réussie!');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showToast(data.detail || 'Erreur de connexion', 'error');
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
                loginBtn.disabled = false;
            }
        } catch (error) {
            showToast('Erreur de connexion au serveur', 'error');
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            loginBtn.disabled = false;
        }
    });
    
    // Toast Notification Function
    const toast = document.getElementById('toast');
    const toastClose = document.querySelector('.toast-close');
    
    function showToast(message, type = 'success') {
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastMessage = toast.querySelector('.toast-message');
        
        switch(type) {
            case 'error':
                toastIcon.className = 'fas fa-times-circle';
                toastIcon.style.color = 'var(--danger-color)';
                break;
            case 'warning':
                toastIcon.className = 'fas fa-exclamation-triangle';
                toastIcon.style.color = 'var(--warning-color)';
                break;
            default:
                toastIcon.className = 'fas fa-check-circle';
                toastIcon.style.color = 'var(--success-color)';
        }
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    toastClose.addEventListener('click', function() {
        toast.classList.remove('show');
    });
    
    // Add some interactive effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 12px 40px 0 var(--shadow-color)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 8px 32px 0 var(--shadow-color)';
        });
    });
});
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
    
    // Password Strength Check
    const passwordInput = document.getElementById('password');
    const strengthProgress = document.querySelector('.strength-progress');
    const strengthText = document.querySelector('.strength-text');
    
    passwordInput.addEventListener('input', checkPasswordStrength);
    
    function checkPasswordStrength() {
        const password = passwordInput.value;
        let strength = 0;
        
        // Check password length
        if (password.length >= 8) strength += 20;
        
        // Check for lowercase letters
        if (/[a-z]/.test(password)) strength += 20;
        
        // Check for uppercase letters
        if (/[A-Z]/.test(password)) strength += 20;
        
        // Check for numbers
        if (/[0-9]/.test(password)) strength += 20;
        
        // Check for special characters
        if (/[^A-Za-z0-9]/.test(password)) strength += 20;
        
        // Update strength bar and text
        strengthProgress.style.width = `${strength}%`;
        
        if (strength < 40) {
            strengthProgress.style.backgroundColor = 'var(--danger-color)';
            strengthText.textContent = 'Faible';
        } else if (strength < 80) {
            strengthProgress.style.backgroundColor = 'var(--warning-color)';
            strengthText.textContent = 'Moyen';
        } else {
            strengthProgress.style.backgroundColor = 'var(--success-color)';
            strengthText.textContent = 'Fort';
        }
    }
    
    // Register Form Submission
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const terms = document.getElementById('terms').checked;
        
        // Validation
        if (!fullname || !email || !username || !password || !confirmPassword) {
            showToast('Veuillez remplir tous les champs', 'error');
            return;
        }
        
        if (!terms) {
            showToast('Veuillez accepter les termes et conditions', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        if (password.length < 8) {
            showToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
            return;
        }
        
        // Split fullname into first_name and last_name
        const nameParts = fullname.split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last name if only one name provided
        
        // Prepare data for API
        const userData = {
            username: username,
            email: email,
            password: password,
            first_name: first_name,
            last_name: last_name,
            phone: "0000000000", // You might want to add a phone field to your form
            expire_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
        };
        
        // Register process
        const registerBtn = this.querySelector('button[type="submit"]');
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
        registerBtn.disabled = true;
        
        try {
            // API call to register
            const response = await fetch('http://127.0.0.1:8000/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',  // أضف هذا السطر

                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Compte créé avec succès!');
                
                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 1500);
            } else {
                // Handle different error cases
                if (data.username && data.username.includes('already exists')) {
                    showToast('Ce nom d\'utilisateur est déjà utilisé', 'error');
                } else if (data.email && data.email.includes('already exists')) {
                    showToast('Cet email est déjà utilisé', 'error');
                } else {
                    showToast(data.detail || 'Erreur lors de la création du compte', 'error');
                }
                registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Créer un compte';
                registerBtn.disabled = false;
            }
        } catch (error) {
            showToast('Erreur de connexion au serveur', 'error');
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Créer un compte';
            registerBtn.disabled = false;
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
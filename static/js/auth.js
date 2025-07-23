document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form-container');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.classList.contains(`${target}-form`)) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': username,
                    'password': password,
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', username);
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                loginError.textContent = data.detail || 'Login failed. Please check your credentials.';
            }
        } catch (error) {
            loginError.textContent = 'An error occurred. Please try again.';
            console.error('Login error:', error);
        }
    });
    
    // Register form submission
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            registerError.textContent = 'Passwords do not match.';
            return;
        }
        
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': username,
                    'password': password,
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show success message and switch to login tab
                registerError.textContent = '';
                alert('Registration successful! Please log in.');
                
                // Clear form
                registerForm.reset();
                
                // Switch to login tab
                document.querySelector('[data-tab="login"]').click();
            } else {
                registerError.textContent = data.detail || 'Registration failed. Please try again.';
            }
        } catch (error) {
            registerError.textContent = 'An error occurred. Please try again.';
            console.error('Registration error:', error);
        }
    });
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/dashboard';
    }
});
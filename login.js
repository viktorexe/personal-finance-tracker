// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginForm && loginError) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            loginError.textContent = 'Logging in...';
            console.log('Attempting to login user:', username);
            
            try {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                
                const response = await fetch('/api/token', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('Login response status:', response.status);
                
                let data;
                try {
                    data = await response.json();
                    console.log('Login response data:', data);
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                    data = { detail: 'Error parsing server response' };
                }
                
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
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/dashboard';
    }
});
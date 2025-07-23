// Registration functionality
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');
    
    if (registerForm && registerError) {
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
            
            registerError.textContent = 'Registering...';
            console.log('Attempting to register user:', username);
            
            try {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                
                const response = await fetch('/api/direct-register', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('Registration response status:', response.status);
                
                let data;
                try {
                    data = await response.json();
                    console.log('Registration response data:', data);
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                    data = { detail: 'Error parsing server response' };
                }
                
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
    }
});
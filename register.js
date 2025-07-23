// Registration functionality
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');
    
    if (registerForm && registerError) {
        // Test API connection first
        fetch('/api/direct-test')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('API connection test failed');
            })
            .then(data => {
                console.log('API test successful:', data);
            })
            .catch(error => {
                console.error('API test failed:', error);
                registerError.textContent = 'Warning: API connection test failed. Registration may not work.';
                registerError.style.color = '#ff9800';
            });
        
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
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        data = await response.json();
                        console.log('Registration response data:', data);
                    } else {
                        const text = await response.text();
                        console.error('Non-JSON response:', text);
                        data = { detail: 'Server returned non-JSON response' };
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
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
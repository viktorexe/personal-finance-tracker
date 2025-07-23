// API test functionality
document.addEventListener('DOMContentLoaded', function() {
    const testApiBtn = document.getElementById('testApiBtn');
    const apiStatus = document.getElementById('apiStatus');
    
    if (testApiBtn && apiStatus) {
        testApiBtn.addEventListener('click', async () => {
            apiStatus.textContent = 'Testing API connection...';
            apiStatus.style.color = '#666';
            
            try {
                const response = await fetch('/api/test');
                const data = await response.json();
                
                console.log('API test response:', data);
                
                if (response.ok) {
                    apiStatus.textContent = 'API connection successful!';
                    apiStatus.style.color = '#4caf50';
                } else {
                    apiStatus.textContent = 'API connection failed';
                    apiStatus.style.color = '#f44336';
                }
            } catch (error) {
                console.error('API test error:', error);
                apiStatus.textContent = 'API connection failed';
                apiStatus.style.color = '#f44336';
            }
        });
    }
});
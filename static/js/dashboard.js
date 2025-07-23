document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    // Set username in header
    document.getElementById('username').textContent = username;
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.section');
    const sectionTitle = document.getElementById('sectionTitle');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.dataset.section;
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) {
                    section.classList.add('active');
                    sectionTitle.textContent = link.querySelector('span').textContent;
                }
            });
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/';
    });
    
    // Initialize data
    let userSettings = {};
    let transactions = [];
    let categories = [];
    
    // Fetch user settings
    async function fetchSettings() {
        try {
            const response = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                userSettings = await response.json();
                
                // Update UI with settings
                document.getElementById('currencySelect').value = userSettings.currency || 'USD';
                document.getElementById('themeSelect').value = userSettings.theme || 'light';
                
                // Apply theme
                applyTheme(userSettings.theme || 'light');
                
                // Update categories
                categories = userSettings.categories || [];
                updateCategoriesUI();
                
                return userSettings;
            } else {
                console.error('Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
        
        return {};
    }
    
    // Apply theme
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    // Update categories UI
    function updateCategoriesUI() {
        // Update categories list in settings
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';
        
        categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <span>${category}</span>
                <span class="category-delete" data-category="${category}">
                    <i class="fas fa-trash"></i>
                </span>
            `;
            categoriesList.appendChild(item);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.category-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                categories = categories.filter(c => c !== category);
                updateCategoriesUI();
            });
        });
        
        // Update category dropdowns
        const categoryDropdowns = document.querySelectorAll('#transactionCategory, #categoryFilter');
        categoryDropdowns.forEach(dropdown => {
            const currentValue = dropdown.value;
            dropdown.innerHTML = '';
            
            if (dropdown.id === 'categoryFilter') {
                dropdown.innerHTML = '<option value="all">All Categories</option>';
            }
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                dropdown.appendChild(option);
            });
            
            // Restore selected value if possible
            if (categories.includes(currentValue)) {
                dropdown.value = currentValue;
            }
        });
    }
    
    // Save settings
    document.getElementById('saveSettings').addEventListener('click', async () => {
        const currency = document.getElementById('currencySelect').value;
        const theme = document.getElementById('themeSelect').value;
        
        const updatedSettings = {
            ...userSettings,
            currency,
            theme,
            categories
        };
        
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSettings)
            });
            
            if (response.ok) {
                alert('Settings saved successfully!');
                userSettings = updatedSettings;
                applyTheme(theme);
            } else {
                alert('Failed to save settings.');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An error occurred while saving settings.');
        }
    });
    
    // Add category
    document.getElementById('addCategory').addEventListener('click', () => {
        const newCategory = document.getElementById('newCategory').value.trim();
        
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            document.getElementById('newCategory').value = '';
            updateCategoriesUI();
        }
    });
    
    // Fetch transactions
    async function fetchTransactions() {
        try {
            const response = await fetch('/api/transactions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                transactions = await response.json();
                updateTransactionsUI();
                return transactions;
            } else {
                console.error('Failed to fetch transactions');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
        
        return [];
    }
    
    // Update transactions UI
    function updateTransactionsUI() {
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Update recent transactions
        const recentTransactions = document.getElementById('recentTransactions');
        recentTransactions.innerHTML = '';
        
        const recentItems = sortedTransactions.slice(0, 5);
        
        if (recentItems.length === 0) {
            recentTransactions.innerHTML = '<p>No transactions yet. Add your first transaction!</p>';
        } else {
            recentItems.forEach(transaction => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                
                const formattedAmount = formatCurrency(transaction.amount, userSettings.currency);
                const transactionType = transaction.transaction_type;
                
                item.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-icon">
                            <i class="fas ${transactionType === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.description}</h4>
                            <p>${transaction.category} • ${formatDate(transaction.date)}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${transactionType}">
                        ${transactionType === 'income' ? '+' : '-'} ${formattedAmount}
                    </div>
                `;
                
                recentTransactions.appendChild(item);
            });
        }
        
        // Update transactions table
        const transactionsTableBody = document.getElementById('transactionsTableBody');
        transactionsTableBody.innerHTML = '';
        
        if (sortedTransactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" style="text-align: center;">No transactions found</td>';
            transactionsTableBody.appendChild(row);
        } else {
            sortedTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                const formattedAmount = formatCurrency(transaction.amount, userSettings.currency);
                const transactionType = transaction.transaction_type;
                
                row.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.category}</td>
                    <td class="${transactionType}">
                        ${transactionType === 'income' ? '+' : '-'} ${formattedAmount}
                    </td>
                    <td>${capitalizeFirstLetter(transactionType)}</td>
                    <td>
                        <button class="btn-small edit-transaction" data-id="${transaction._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small delete-transaction" data-id="${transaction._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                transactionsTableBody.appendChild(row);
            });
            
            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-transaction').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const transaction = transactions.find(t => t._id === id);
                    if (transaction) {
                        openTransactionModal(transaction);
                    }
                });
            });
            
            document.querySelectorAll('.delete-transaction').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this transaction?')) {
                        const id = btn.dataset.id;
                        await deleteTransaction(id);
                    }
                });
            });
        }
        
        // Update stats
        fetchStats();
    }
    
    // Format currency
    function formatCurrency(amount, currency = 'USD') {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        });
        
        return formatter.format(amount);
    }
    
    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Fetch stats
    async function fetchStats() {
        try {
            const response = await fetch('/api/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                
                // Update summary cards
                document.getElementById('totalIncome').textContent = formatCurrency(stats.total_income, userSettings.currency);
                document.getElementById('totalExpenses').textContent = formatCurrency(stats.total_expenses, userSettings.currency);
                document.getElementById('balance').textContent = formatCurrency(stats.balance, userSettings.currency);
                
                // Update charts
                updateCharts(stats);
                
                return stats;
            } else {
                console.error('Failed to fetch stats');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
        
        return {};
    }
    
    // Update charts
    function updateCharts(stats) {
        // Expense distribution chart
        const expenseCtx = document.getElementById('expenseChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.expenseChart) {
            window.expenseChart.destroy();
        }
        
        const expenseCategories = stats.expenses_by_category.map(item => item._id);
        const expenseAmounts = stats.expenses_by_category.map(item => item.total);
        
        window.expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: expenseCategories,
                datasets: [{
                    data: expenseAmounts,
                    backgroundColor: [
                        '#4361ee',
                        '#3f37c9',
                        '#4cc9f0',
                        '#4caf50',
                        '#ff9800',
                        '#f44336',
                        '#9c27b0',
                        '#2196f3',
                        '#607d8b'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
        
        // Monthly overview chart
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.monthlyChart) {
            window.monthlyChart.destroy();
        }
        
        // Group transactions by month
        const monthlyData = getMonthlyData();
        
        window.monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.incomeData,
                        backgroundColor: '#4caf50',
                        borderColor: '#4caf50',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: monthlyData.expenseData,
                        backgroundColor: '#f44336',
                        borderColor: '#f44336',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Get monthly data for chart
    function getMonthlyData() {
        const months = [];
        const incomeData = [];
        const expenseData = [];
        
        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push(monthYear);
            
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            // Filter transactions for this month
            const monthTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= monthStart && transactionDate <= monthEnd;
            });
            
            // Calculate income and expenses
            const income = monthTransactions
                .filter(t => t.transaction_type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expense = monthTransactions
                .filter(t => t.transaction_type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            incomeData.push(income);
            expenseData.push(expense);
        }
        
        return { labels: months, incomeData, expenseData };
    }
    
    // Transaction modal
    const transactionModal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const transactionForm = document.getElementById('transactionForm');
    const transactionId = document.getElementById('transactionId');
    
    // Open transaction modal
    function openTransactionModal(transaction = null) {
        if (transaction) {
            modalTitle.textContent = 'Edit Transaction';
            transactionId.value = transaction._id;
            document.getElementById('transactionAmount').value = transaction.amount;
            document.getElementById('transactionDesc').value = transaction.description;
            document.getElementById('transactionCategory').value = transaction.category;
            document.getElementById('transactionDate').value = transaction.date;
            document.querySelector(`input[name="transactionTypeRadio"][value="${transaction.transaction_type}"]`).checked = true;
        } else {
            modalTitle.textContent = 'Add Transaction';
            transactionForm.reset();
            transactionId.value = '';
            document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        }
        
        transactionModal.style.display = 'block';
    }
    
    // Close transaction modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        transactionModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            transactionModal.style.display = 'none';
        }
    });
    
    // Add transaction buttons
    document.getElementById('addTransactionBtn').addEventListener('click', () => {
        openTransactionModal();
    });
    
    document.getElementById('addTransactionBtnFull').addEventListener('click', () => {
        openTransactionModal();
    });
    
    // Transaction form submission
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = transactionId.value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const description = document.getElementById('transactionDesc').value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const transaction_type = document.querySelector('input[name="transactionTypeRadio"]:checked').value;
        
        const transactionData = {
            amount,
            description,
            category,
            date,
            transaction_type
        };
        
        try {
            let response;
            
            if (id) {
                // Update existing transaction
                response = await fetch(`/api/transactions/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(transactionData)
                });
            } else {
                // Create new transaction
                response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(transactionData)
                });
            }
            
            if (response.ok) {
                transactionModal.style.display = 'none';
                await fetchTransactions();
            } else {
                alert('Failed to save transaction.');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('An error occurred while saving the transaction.');
        }
    });
    
    // Delete transaction
    async function deleteTransaction(id) {
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                await fetchTransactions();
            } else {
                alert('Failed to delete transaction.');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('An error occurred while deleting the transaction.');
        }
    }
    
    // Apply filters
    document.getElementById('applyFilters').addEventListener('click', () => {
        const typeFilter = document.getElementById('transactionType').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const dateRangeFilter = document.getElementById('dateRange').value;
        
        // Filter transactions
        let filteredTransactions = [...transactions];
        
        // Apply type filter
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.transaction_type === typeFilter);
        }
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }
        
        // Apply date range filter
        if (dateRangeFilter !== 'all') {
            const now = new Date();
            let startDate;
            
            switch (dateRangeFilter) {
                case 'thisMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'lastMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    filteredTransactions = filteredTransactions.filter(t => {
                        const date = new Date(t.date);
                        return date >= startDate && date <= endDate;
                    });
                    return;
                case 'thisYear':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    return;
            }
            
            filteredTransactions = filteredTransactions.filter(t => {
                const date = new Date(t.date);
                return date >= startDate;
            });
        }
        
        // Update UI with filtered transactions
        updateTransactionsTableUI(filteredTransactions);
    });
    
    // Update transactions table with filtered data
    function updateTransactionsTableUI(filteredTransactions) {
        const transactionsTableBody = document.getElementById('transactionsTableBody');
        transactionsTableBody.innerHTML = '';
        
        if (filteredTransactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" style="text-align: center;">No transactions found</td>';
            transactionsTableBody.appendChild(row);
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...filteredTransactions].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            const formattedAmount = formatCurrency(transaction.amount, userSettings.currency);
            const transactionType = transaction.transaction_type;
            
            row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transactionType}">
                    ${transactionType === 'income' ? '+' : '-'} ${formattedAmount}
                </td>
                <td>${capitalizeFirstLetter(transactionType)}</td>
                <td>
                    <button class="btn-small edit-transaction" data-id="${transaction._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small delete-transaction" data-id="${transaction._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            transactionsTableBody.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-transaction').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const transaction = transactions.find(t => t._id === id);
                if (transaction) {
                    openTransactionModal(transaction);
                }
            });
        });
        
        document.querySelectorAll('.delete-transaction').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    const id = btn.dataset.id;
                    await deleteTransaction(id);
                }
            });
        });
    }
    
    // Initialize data
    async function initializeData() {
        await fetchSettings();
        await fetchTransactions();
    }
    
    // Start the app
    initializeData();
    
    // Set up real-time sync (every second)
    setInterval(async () => {
        await fetchSettings();
        await fetchTransactions();
    }, 1000);
});
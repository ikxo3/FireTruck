document.addEventListener('DOMContentLoaded', function() {
    // المتغيرات العامة
    let accessToken = localStorage.getItem('access_token');
    let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // التحقق من صحة التوكن وإعادة التوجيه إذا لزم الأمر
    if (!accessToken || !currentUser.id) {
        window.location.href = '/login';
        return;
    }
    
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
    
    // Logout Button
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', function() {
        // محاولة عمل logout من الخادم
        fetch('http://127.0.0.1:8000/auth/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                refresh: localStorage.getItem('refresh_token')
            })
        }).catch(error => console.error('Logout error:', error));
        
        // مسح البيانات المحلية
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        showToast('Déconnexion réussie');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    });
    
    // Mobile Sidebar Toggle (for smaller screens)
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.style.position = 'fixed';
    menuToggle.style.top = '20px';
    menuToggle.style.left = '20px';
    menuToggle.style.zIndex = '99';
    menuToggle.style.fontSize = '24px';
    menuToggle.style.cursor = 'pointer';
    menuToggle.style.display = 'none';
    document.body.appendChild(menuToggle);
    
    // Show/hide menu toggle based on screen size
    function checkScreenSize() {
        if (window.innerWidth <= 992) {
            menuToggle.style.display = 'block';
        } else {
            menuToggle.style.display = 'none';
            sidebar.classList.remove('active');
        }
    }
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
    
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992 && !sidebar.contains(e.target) && e.target !== menuToggle) {
            sidebar.classList.remove('active');
        }
    });
    
    // Navigation Items Functionality
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        'Nouvelle Vente': 'sales-table-container',
        'Recherche Clients': 'search-panel',
        'Ventes Aujourd\'hui': 'quick-stats',
        'Expiration Proche': 'sales-table-container'
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionName = this.querySelector('.nav-text').textContent;
            const sectionId = sections[sectionName];
            
            // Update active state
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Handle each section differently
            switch(sectionName) {
                case 'Nouvelle Vente':
                    // Open add sale modal
                    document.getElementById('add-sale-btn').click();
                    break;
                    
                case 'Recherche Clients':
                    // Focus on search input
                    document.getElementById('main-search').focus();
                    scrollToSection(sectionId);
                    break;
                    
                case 'Ventes Aujourd\'hui':
                    // Filter table to show today's sales
                    document.getElementById('date-range').value = 'today';
                    fetchTodaySales();
                    scrollToSection(sectionId);
                    break;
                    
                case 'Expiration Proche':
                    // Filter to show expiring soon items
                    fetchExpiringSales();
                    scrollToSection(sectionId);
                    break;
            }
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Function to scroll to a section
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Function to fetch expiring sales
    async function fetchExpiringSales() {
        try {
            const response = await fetch('http://127.0.0.1:8000/sales/expiring_soon_sales/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const sales = await response.json();
                populateSalesTable(sales);
                showToast('Affichage des extincteurs expirant bientôt');
            } else if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await refreshToken();
                if (refreshed) {
                    fetchExpiringSales(); // Retry the request
                } else {
                    window.location.href = '/login';
                }
            } else {
                showToast('Erreur lors du chargement des ventes expirantes', 'error');
            }
        } catch (error) {
            console.error('Error fetching expiring sales:', error);
            showToast('Erreur de connexion au serveur', 'error');
        }
    }
    
    // Modal Functionality
    const addSaleBtn = document.getElementById('add-sale-btn');
    const saleModal = document.getElementById('sale-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    // Open modal
    addSaleBtn.addEventListener('click', function() {
        document.getElementById('modal-title').textContent = 'Ajouter Nouvelle Vente';
        document.getElementById('sale-form').reset();
        saleModal.classList.add('active');
    });
    
    // Close modal
    function closeModalFunc() {
        saleModal.classList.remove('active');
        delete saleForm.dataset.editingId;
    }
    
    closeModal.addEventListener('click', closeModalFunc);
    cancelBtn.addEventListener('click', closeModalFunc);
    
    // Close modal when clicking outside
    saleModal.addEventListener('click', function(e) {
        if (e.target === saleModal) {
            closeModalFunc();
        }
    });
    
    // Form Submission
    const saleForm = document.getElementById('sale-form');
    saleForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Form validation
        const requiredFields = ['customer-name', 'customer-phone', 'extinguisher-type', 
                              'extinguisher-size', 'quantity', 'price', 'expiry-date'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--danger-color)';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        // Prepare sale data
        const saleData = {
            costumer_name: document.getElementById('customer-name').value,
            costumer_phone: document.getElementById('customer-phone').value,
            company_name: document.getElementById('company').value || '',
            bottel_type: document.getElementById('extinguisher-type').value,
            bottel_size: document.getElementById('extinguisher-size').value,
            price: parseFloat(document.getElementById('price').value),
            expire_date_bottel: document.getElementById('expiry-date').value,
            quantity: parseInt(document.getElementById('quantity').value)
        };
        
        // Check if we're editing an existing sale
        const isEditing = saleForm.dataset.editingId;
        
        try {
            let response;
            if (isEditing) {
                // Update existing sale
                response = await fetch(`http://127.0.0.1:8000/sales/${isEditing}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(saleData)
                });
            } else {
                // Create new sale
                response = await fetch('http://127.0.0.1:8000/sales/validate_sale/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(saleData)
                });
            }
            
            if (response.ok) {
                showToast(isEditing ? 'Vente modifiée avec succès!' : 'Vente enregistrée avec succès!');
                
                // Refresh sales data and stats
                fetchSales();
                updateQuickStats();
                
                setTimeout(() => {
                    closeModalFunc();
                    this.reset();
                }, 1500);
            } else {
                const errorData = await response.json();
                showToast(errorData.detail || 'Erreur lors de l\'enregistrement', 'error');
            }
        } catch (error) {
            console.error('Error saving sale:', error);
            showToast('Erreur de connexion au serveur', 'error');
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
    
    // Function to add event listeners to table row
    function addRowEventListeners(row, saleId) {
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', function() {
            editSale(saleId);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteSale(saleId, row);
        });
    }
    
    // Edit sale function
    async function editSale(saleId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/sales/${saleId}/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const sale = await response.json();
                
                document.getElementById('modal-title').textContent = 'Modifier Vente';
                document.getElementById('customer-name').value = sale.costumer_name;
                document.getElementById('customer-phone').value = sale.costumer_phone;
                document.getElementById('company').value = sale.company_name;
                document.getElementById('extinguisher-type').value = sale.bottel_type;
                document.getElementById('extinguisher-size').value = sale.bottel_size;
                document.getElementById('quantity').value = 1; // Assuming quantity is 1 as it's not in the model
                document.getElementById('price').value = sale.price;
                document.getElementById('expiry-date').value = sale.expire_date_bottel;
                
                // Store the sale ID being edited
                saleForm.dataset.editingId = saleId;
                
                saleModal.classList.add('active');
            } else {
                showToast('Erreur lors du chargement de la vente', 'error');
            }
        } catch (error) {
            console.error('Error fetching sale:', error);
            showToast('Erreur de connexion au serveur', 'error');
        }
    }
    
    // Delete sale function
    async function deleteSale(saleId, row) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette vente?')) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/sales/${saleId}/delete_sale/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (response.ok) {
                    row.style.opacity = '0.5';
                    showToast('Vente supprimée avec succès');
                    
                    setTimeout(() => {
                        row.remove();
                        updateTableFooter();
                        updateQuickStats(); // تحديث الإحصائيات بعد الحذف
                    }, 1000);
                } else {
                    showToast('Erreur lors de la suppression', 'error');
                }
            } catch (error) {
                console.error('Error deleting sale:', error);
                showToast('Erreur de connexion au serveur', 'error');
            }
        }
    }
    
    // Search Functionality
    const searchBox = document.getElementById('main-search');
    const searchBtn = document.querySelector('.search-btn');
    
    async function performSearch() {
        const searchTerm = searchBox.value.toLowerCase();
        
        if (!searchTerm) {
            // If search term is empty, fetch all sales
            fetchSales();
            return;
        }
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/sales/search_costumer/?q=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const sales = await response.json();
                populateSalesTable(sales);
                showToast(`${sales.length} résultat(s) trouvé(s)`);
            } else {
                showToast('Erreur lors de la recherche', 'error');
            }
        } catch (error) {
            console.error('Error searching:', error);
            showToast('Erreur de connexion au serveur', 'error');
        }
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchBox.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Filter Functionality
    const applyFiltersBtn = document.querySelector('.apply-filters');
    const clearFiltersBtn = document.querySelector('.clear-filters');
    
    applyFiltersBtn.addEventListener('click', function() {
        const dateRange = document.getElementById('date-range').value;
        
        if (dateRange === 'today') {
            fetchTodaySales();
        } else {
            fetchSales();
        }
        
        showToast('Filtres appliqués');
    });
    
    clearFiltersBtn.addEventListener('click', function() {
        document.getElementById('date-range').value = 'today';
        document.getElementById('company-type').value = 'all';
        searchBox.value = '';
        
        fetchSales();
        showToast('Filtres effacés');
    });
    
    // Update table footer with current record count
    function updateTableFooter(count) {
        const totalRecords = document.querySelector('.total-records');
        const rows = document.querySelectorAll('.sales-table tbody tr:not([style*="display: none"])');
        const visibleCount = count !== undefined ? count : rows.length;
        
        totalRecords.textContent = `Total: ${visibleCount} enregistrement${visibleCount !== 1 ? 's' : ''}`;
    }
    
    // Update quick stats with API data
    async function updateQuickStats() {
        try {
            // Fetch stats from the API
            const response = await fetch('http://127.0.0.1:8000/sales/stats/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                
                // Update stats cards
                document.querySelector('.stat-card.sales .stat-value').textContent = stats.today_sales || 0;
                document.querySelector('.stat-card.revenue .stat-value').textContent = (stats.total_revenue || 0).toLocaleString('fr-FR') + ' DA';
                document.querySelector('.stat-card.expiring .stat-value').textContent = stats.expiring_soon || 0;
            } else if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await refreshToken();
                if (refreshed) {
                    updateQuickStats(); // Retry the request
                } else {
                    window.location.href = '/login';
                }
            } else {
                console.error('Error fetching stats:', response.status);
                showToast('Erreur lors du chargement des statistiques', 'error');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            showToast('Erreur de connexion au serveur', 'error');
        }
    }
    
    // Fetch all sales
    async function fetchSales() {
        try {
            const response = await fetch('http://127.0.0.1:8000/sales/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const sales = await response.json();
                populateSalesTable(sales);
                return sales;
            } else if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await refreshToken();
                if (refreshed) {
                    return fetchSales(); // Retry the request
                } else {
                    window.location.href = '/login';
                }
            } else {
                showToast('Erreur lors du chargement des ventes', 'error');
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            showToast('Erreur de connexion au serveur', 'error');
        }
    }
    
    // Fetch today's sales
    async function fetchTodaySales() {
        try {
            const response = await fetch('http://127.0.0.1:8000/sales/today_sales/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const sales = await response.json();
                populateSalesTable(sales);
                return sales;
            } else if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await refreshToken();
                if (refreshed) {
                    return fetchTodaySales(); // Retry the request
                } else {
                    window.location.href = '/login';
                }
            } else {
                showToast('Erreur lors du chargement des ventes', 'error');
            }
        } catch (error) {
            console.error('Error fetching today sales:', error);
            showToast('Erreur de connexion au serveur', 'error');
        }
    }
    
    // Populate sales table with data
    function populateSalesTable(sales) {
        const tbody = document.querySelector('.sales-table tbody');
        tbody.innerHTML = '';
        
        sales.forEach(sale => {
            const expiryDate = new Date(sale.expire_date_bottel);
            const today = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(today.getMonth() + 1);
            
            let expiryClass = 'expiry-normal';
            if (expiryDate < today) {
                expiryClass = 'expiry-danger';
            } else if (expiryDate < nextMonth) {
                expiryClass = 'expiry-warning';
            }
            
            const saleDate = new Date(sale.sale_date);
            const formattedDate = saleDate.toLocaleDateString('fr-FR');
            const formattedExpiry = expiryDate.toLocaleDateString('fr-FR');
            
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${formattedDate}</td>
                <td>${sale.costumer_name}</td>
                <td>${sale.costumer_phone}</td>
                <td>${sale.company_name || '-'}</td>
                <td>${capitalizeFirstLetter(sale.bottel_type)}</td>
                <td>${sale.bottel_size}</td>
                <td>1</td> <!-- Assuming quantity is 1 as it's not in the model -->
                <td>${parseFloat(sale.price).toLocaleString('fr-FR')}</td>
                <td class="${expiryClass}">${formattedExpiry}</td>
                <td class="actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tbody.appendChild(newRow);
            
            // Add event listeners to new buttons
            addRowEventListeners(newRow, sale.id);
        });
        
        updateTableFooter(sales.length);
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Refresh access token
    async function refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            const response = await fetch('http://127.0.0.1:8000/auth/token/refresh/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh: refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access);
                accessToken = data.access;
                return true;
            } else {
                console.error('Token refresh failed');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return false;
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            window.location.href = '/login';
            return false;
        }
    }
    
    // Initialize date display
    function updateDateDisplay() {
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('fr-FR', options);
    }
    
    // Initialize the page
    updateDateDisplay();
    fetchSales();
    updateQuickStats();
    
    // Simulate connection status changes (for demo)
    setInterval(() => {
        const connectionStatus = document.querySelector('.connection-status');
        const isConnected = connectionStatus.classList.contains('connected');
        
        if (Math.random() > 0.9) {
            if (isConnected) {
                connectionStatus.classList.remove('connected');
                connectionStatus.classList.add('disconnected');
                connectionStatus.querySelector('span').textContent = 'Déconnecté';
                showToast('Connexion perdue', 'error');
            } else {
                connectionStatus.classList.remove('disconnected');
                connectionStatus.classList.add('connected');
                connectionStatus.querySelector('span').textContent = 'Connecté';
                showToast('Connexion rétablie');
            }
        }
    }, 10000);
});
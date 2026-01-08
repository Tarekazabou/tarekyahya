/**
 * Admin Dashboard JavaScript
 * Primavet - Espace Administration
 */

// ==================== GLOBAL STATE ====================

let currentUser = null;
let deleteNewsId = null;
let deleteJobId = null;
let deleteProductId = null;
let deleteShowroomId = null;
let deleteMessageId = null;
let deleteType = null;

// Offline/local fallback storage for demo mode
const LOCAL_KEYS = {
    news: 'admin_news',
    jobs: 'admin_jobs'
};

function readLocal(type) {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEYS[type]) || '[]');
    } catch (_) {
        return [];
    }
}

function writeLocal(type, data) {
    try {
        localStorage.setItem(LOCAL_KEYS[type], JSON.stringify(data));
    } catch (e) {
        console.error('Local storage write failed:', e);
    }
}

function upsertLocal(type, item, id) {
    const items = readLocal(type);
    if (id) {
        const idx = items.findIndex((x) => String(x.id) === String(id));
        if (idx >= 0) {
            items[idx] = { ...items[idx], ...item, id };
        }
    } else {
        item.id = Date.now();
        items.push(item);
        id = item.id;
    }
    writeLocal(type, items);
    return items.find((x) => String(x.id) === String(id));
}

function deleteLocal(type, id) {
    const items = readLocal(type).filter((x) => String(x.id) !== String(id));
    writeLocal(type, items);
}

// CSRF Token
const csrfToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
sessionStorage.setItem('csrf_token', csrfToken);

// ==================== AUTHENTICATION ====================

async function checkAuth() {
    try {
        if (typeof AuthManager === 'undefined') {
            currentUser = { email: 'demo@primavet.tn', role: 'admin' };
            console.warn('AuthManager indisponible, passage en mode démo local.');
            return true;
        }

        const session = await AuthManager.getSession();
        
        if (!session) {
            console.warn('No session found, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        currentUser = session.user;
        console.log('✅ User authenticated:', currentUser.email);
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        currentUser = { email: 'demo@primavet.tn', role: 'admin' };
        showToast('Mode démo: connexion locale', 'error');
        return true;
    }
}

// Auth state change listener will be set up in init

// ==================== CSRF & RATE LIMITING ====================

function validateCsrf() {
    return sessionStorage.getItem('csrf_token') === csrfToken;
}

async function rateLimitedRequest(requestFn, key = 'admin') {
    if (!RateLimiter.canMakeRequest(key)) {
        showToast('Trop de requêtes. Veuillez patienter.', 'error');
        throw new Error('Rate limit exceeded');
    }
    return await requestFn();
}

// ==================== EVENT DELEGATION ====================
// Central click handler - no more inline onclick attributes needed

function initGlobalEventListeners() {
    document.addEventListener('click', (e) => {
        // Find the closest button if user clicked on the icon <i> inside
        const btn = e.target.closest('button[data-action]');
        
        // If no button clicked or button has no action, ignore
        if (!btn || !btn.dataset.action) return;

        // Get the action and ID
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        console.log(`🔘 Action detected: ${action} on ID: ${id}`);

        // Route to the correct function
        switch (action) {
            // --- NEWS ---
            case 'edit-news':
                editNews(parseInt(id));
                break;
            case 'delete-news':
                confirmDeleteNews(parseInt(id));
                break;
            case 'reload-news':
                loadNewsTable();
                break;

            // --- JOBS ---
            case 'edit-job':
                editJob(parseInt(id));
                break;
            case 'delete-job':
                confirmDeleteJob(parseInt(id));
                break;
            case 'toggle-job':
                const currentStatus = btn.dataset.active === 'true';
                toggleJob(parseInt(id), !currentStatus);
                break;

            // --- PRODUCTS ---
            case 'edit-product':
                editProduct(parseInt(id));
                break;
            case 'delete-product':
                confirmDeleteProduct(parseInt(id));
                break;

            // --- SHOWROOM ---
            case 'edit-showroom':
                editShowroom(parseInt(id));
                break;
            case 'delete-showroom':
                confirmDeleteShowroom(parseInt(id));
                break;

            // --- MESSAGES ---
            case 'view-message':
                viewMessage(id); // UUID string, don't parse
                break;
            case 'delete-message':
                confirmDeleteMessage(id); // UUID string, don't parse
                break;
        }
    });
    
    console.log('✅ Global event listeners initialized');
}

// ==================== NAVIGATION ====================

function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    
    // Update sidebar
    sidebarLinks.forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

    // Update sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionName}`)?.classList.add('active');

    // Load section data
    if (sectionName === 'news') loadNewsTable();
    if (sectionName === 'jobs') loadJobsTable();
    if (sectionName === 'products') loadProductsTable();
    if (sectionName === 'showroom') loadShowroomTable();
    if (sectionName === 'messages') loadMessagesTable();
}

// ==================== DEBUGGING HELPER ====================

function debugLog(operation, data) {
    console.group(`🔍 ${operation}`);
    console.log('Data:', data);
    console.log('User:', currentUser);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle toast-icon-success' : 'fa-exclamation-circle toast-icon-error'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==================== NEWS MANAGEMENT ====================

async function loadNewsTable() {
    const container = document.getElementById('news-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    console.log('📰 Loading news table...');

    try {
        const { data: news, error } = await supabaseClient
            .from('news')
            .select('*')
            .order('published_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ Loaded ${news.length} news items`);

        document.getElementById('news-count-badge').textContent = `${news.length} articles`;
        const statEl = document.getElementById('stat-news-count');
        if (statEl) statEl.textContent = news.length;

        if (news.length === 0) {
            container.innerHTML = '<p class="loading">Aucune actualité pour le moment.</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titre</th>
                        <th>Catégorie</th>
                        <th>Date</th>
                        <th>En avant</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${news.map(article => `
                        <tr>
                            <td><small>${article.id}</small></td>
                            <td><strong>${escapeHtml(article.title)}</strong></td>
                            <td><span class="badge badge-info">${escapeHtml(article.category) || '-'}</span></td>
                            <td>${formatDate(article.published_at)}</td>
                            <td>${article.is_featured ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-warning">Non</span>'}</td>
                            <td class="actions">
                                <button class="btn-icon edit" data-action="edit-news" data-id="${article.id}" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" data-action="delete-news" data-id="${article.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('❌ Error loading news:', error);
        const localNews = readLocal('news');
        if (localNews.length) {
            container.innerHTML = `
                <p class="loading" style="color: #f59e0b;">Mode local: données affichées depuis votre navigateur</p>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Titre</th>
                            <th>Catégorie</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${localNews.map(article => `
                            <tr>
                                <td><strong>${escapeHtml(article.title)}</strong></td>
                                <td><span class="badge badge-info">${escapeHtml(article.category || 'Collection')}</span></td>
                                <td>${escapeHtml(article.published_at || '')}</td>
                                <td class="actions">
                                    <button class="btn-icon edit" data-action="edit-news" data-id="${article.id}" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon delete" data-action="delete-news" data-id="${article.id}" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <p class="loading" style="color: #dc2626;">
                    Erreur de chargement: ${error.message}
                    <br><br>
                    <button class="btn btn-secondary" data-action="reload-news">
                        <i class="fas fa-redo"></i> Réessayer
                    </button>
                </p>
            `;
        }
    }
}

function openNewsModal(newsData = null) {
    console.log('🟢 openNewsModal called', { newsData });


    // Switch to Éditer tab and reset/populate the inline editor
    switchSubtab('news', 'edit');
    document.getElementById('news-form').reset();
    document.getElementById('news-id').value = '';
    const dateInput = document.getElementById('news-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    if (newsData) {
        document.getElementById('news-id').value = newsData.id;
        document.getElementById('news-title').value = newsData.title;
        document.getElementById('news-category').value = newsData.category || 'Collection';
        document.getElementById('news-date').value = newsData.published_at;
        document.getElementById('news-excerpt').value = newsData.excerpt || '';
        document.getElementById('news-content').value = newsData.content || '';
        document.getElementById('news-featured').checked = !!newsData.is_featured;
    }
}

function closeNewsModal() {
    console.log('🔴 closeNewsModal called');
    // Hide inline editor and return to list
    switchSubtab('news', 'list');
}

async function editNews(id) {
    try {
        let article = null;
        const { data: news, error } = await supabaseClient
            .from('news')
            .select('*');

        if (!error && news) {
            article = news.find(n => n.id === id);
        }

        if (!article) {
            article = readLocal('news').find((n) => String(n.id) === String(id));
        }

        if (article) {
            openNewsModal(article);
        } else {
            showToast('Actualité introuvable', 'error');
        }
    } catch (error) {
        const article = readLocal('news').find((n) => String(n.id) === String(id));
        if (article) {
            openNewsModal(article);
            showToast('Mode local: modification hors-ligne', 'error');
        } else {
            showToast('Erreur lors du chargement: ' + error.message, 'error');
        }
    }
}

function confirmDeleteNews(id) {
    deleteNewsId = id;
    deleteType = 'news';
    document.getElementById('confirm-modal').classList.add('active');
}

async function deleteNews(id) {
    console.log('🗑️ Deleting news ID:', id);

    try {
        const result = await supabaseClient
            .from('news')
            .delete()
            .eq('id', id)
            .select();

        if (result.error) throw result.error;

        console.log('✅ News deleted:', result.data);
        showToast('Actualité supprimée avec succès');

        await loadNewsTable();
        await loadDashboardStats();

    } catch (error) {
        console.error('❌ Delete error:', error);

        let errorMsg = 'Erreur lors de la suppression';
        if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes pour supprimer';
        } else if (error.message) {
            errorMsg = error.message;
        }

        // Fallback local delete
        deleteLocal('news', id);
        showToast(`${errorMsg} (supprimé en local)`, 'error');
        await loadNewsTable();
    }
}

async function handleNewsFormSubmit(e) {
    e.preventDefault();

    console.log('📝 News form submitted');

    const newsData = {
        title: document.getElementById('news-title').value.trim(),
        category: document.getElementById('news-category').value,
        published_at: document.getElementById('news-date').value,
        excerpt: document.getElementById('news-excerpt').value.trim(),
        content: document.getElementById('news-content').value.trim(),
        is_featured: document.getElementById('news-featured').checked
    };

    const id = document.getElementById('news-id').value;

    debugLog('News Submit', { id, newsData });

    if (!newsData.title || !newsData.content) {
        showToast('Le titre et le contenu sont obligatoires', 'error');
        return;
    }

    try {
        let result;

        if (id) {
            console.log('🔄 Updating news ID:', id);
            result = await supabaseClient
                .from('news')
                .update(newsData)
                .eq('id', id)
                .select()
                .single();

            if (result.error) throw result.error;

            showToast('Actualité mise à jour avec succès');
            console.log('✅ News updated:', result.data);
        } else {
            console.log('➕ Creating new news');
            result = await supabaseClient
                .from('news')
                .insert([newsData])
                .select()
                .single();

            if (result.error) throw result.error;

            showToast('Actualité créée avec succès');
            console.log('✅ News created:', result.data);
        }

        closeNewsModal();
        await loadNewsTable();
        await loadDashboardStats();

    } catch (error) {
        console.error('❌ News error:', error);

        let errorMsg = 'Erreur lors de l\'enregistrement';
        if (error.code === '23505') {
            errorMsg = 'Une actualité avec ce titre existe déjà';
        } else if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes. Vérifiez vos droits d\'accès.';
        } else if (error.message) {
            errorMsg = error.message;
        }

        // Fallback: store locally so admins can continue working
        const offline = upsertLocal('news', newsData, id);
        showToast(`${errorMsg} (enregistré en local)`, 'error');
        closeNewsModal();
        await loadNewsTable();
    }
}

// ==================== JOBS MANAGEMENT ====================

async function loadJobsTable() {
    const container = document.getElementById('jobs-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    try {
        const jobs = await DataService.getAllJobs();

        document.getElementById('jobs-count-badge').textContent = `${jobs.length} offres`;
        const statEl = document.getElementById('stat-jobs-count');
        if (statEl) statEl.textContent = jobs.length;

        if (jobs.length === 0) {
            container.innerHTML = '<p class="loading">Aucune offre pour le moment.</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Titre</th>
                        <th>Localisation</th>
                        <th>Contrat</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobs.map(job => `
                        <tr>
                            <td><strong>${escapeHtml(job.title)}</strong></td>
                            <td>${escapeHtml(job.location) || '-'}</td>
                            <td><span class="badge badge-info">${escapeHtml(job.contract_type) || '-'}</span></td>
                            <td>${job.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
                            <td class="actions">
                                <button class="btn-icon toggle" data-action="toggle-job" data-id="${job.id}" data-active="${job.is_active}" title="${job.is_active ? 'Désactiver' : 'Activer'}">
                                    <i class="fas ${job.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                </button>
                                <button class="btn-icon edit" data-action="edit-job" data-id="${job.id}" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" data-action="delete-job" data-id="${job.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<p class="loading" style="color: #dc2626;">Erreur de chargement</p>';
        console.error(error);

        const jobs = readLocal('jobs');
        if (jobs.length) {
            container.innerHTML = `
                <p class="loading" style="color: #f59e0b;">Mode local: données affichées depuis votre navigateur</p>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Titre</th>
                            <th>Localisation</th>
                            <th>Contrat</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jobs.map(job => `
                            <tr>
                                <td><strong>${escapeHtml(job.title)}</strong></td>
                                <td>${escapeHtml(job.location) || '-'}</td>
                                <td><span class="badge badge-info">${escapeHtml(job.contract_type) || '-'}</span></td>
                                <td>${job.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
                                <td class="actions">
                                    <button class="btn-icon toggle" data-action="toggle-job" data-id="${job.id}" data-active="${job.is_active}" title="${job.is_active ? 'Désactiver' : 'Activer'}">
                                        <i class="fas ${job.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                    </button>
                                    <button class="btn-icon edit" data-action="edit-job" data-id="${job.id}" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon delete" data-action="delete-job" data-id="${job.id}" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
}

function openJobModal(jobData = null) {
    console.log('🟢 openJobModal called', { jobData });
    switchSubtab('jobs', 'edit');
    document.getElementById('job-form').reset();
    document.getElementById('job-id').value = '';
    document.getElementById('job-active').checked = true;

    if (jobData) {
        document.getElementById('job-id').value = jobData.id;
        document.getElementById('job-title').value = jobData.title;
        document.getElementById('job-location').value = jobData.location || '';
        document.getElementById('job-contract').value = jobData.contract_type || 'CDI';
        document.getElementById('job-experience').value = jobData.experience || '';
        document.getElementById('job-description').value = jobData.description || '';
        document.getElementById('job-active').checked = !!jobData.is_active;
    }
}

function closeJobModal() {
    console.log('🔴 closeJobModal called');
    switchSubtab('jobs', 'list');
}

async function editJob(id) {
    try {
        let job = null;
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*');

        if (!error && jobs) {
            job = jobs.find(j => j.id === id);
        }

        if (!job) {
            job = readLocal('jobs').find((j) => String(j.id) === String(id));
        }

        if (job) {
            openJobModal(job);
        } else {
            showToast('Offre introuvable', 'error');
        }
    } catch (error) {
        const job = readLocal('jobs').find((j) => String(j.id) === String(id));
        if (job) {
            openJobModal(job);
            showToast('Mode local: modification hors-ligne', 'error');
        } else {
            showToast('Erreur lors du chargement: ' + error.message, 'error');
        }
    }
}

async function toggleJob(id, isActive) {
    try {
        await rateLimitedRequest(() => DataService.toggleJobActive(id, isActive));
        showToast(`Offre ${isActive ? 'activée' : 'désactivée'}`);
        loadJobsTable();
    } catch (error) {
        const jobs = readLocal('jobs');
        const idx = jobs.findIndex((j) => String(j.id) === String(id));
        if (idx >= 0) {
            jobs[idx].is_active = isActive;
            writeLocal('jobs', jobs);
            showToast(`Offre ${isActive ? 'activée' : 'désactivée'} (local)`);
            loadJobsTable();
        } else if (error.message !== 'Rate limit exceeded') {
            showToast('Erreur: ' + error.message, 'error');
        }
    }
}

function confirmDeleteJob(id) {
    deleteJobId = id;
    deleteType = 'job';
    document.getElementById('confirm-modal').classList.add('active');
}

async function deleteJob(id) {
    console.log('🗑️ Deleting job ID:', id);

    try {
        const result = await supabaseClient
            .from('jobs')
            .delete()
            .eq('id', id)
            .select();

        if (result.error) throw result.error;

        console.log('✅ Job deleted:', result.data);
        showToast('Offre supprimée avec succès');

        await loadJobsTable();
        await loadDashboardStats();

    } catch (error) {
        console.error('❌ Delete error:', error);

        let errorMsg = 'Erreur lors de la suppression';
        if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes pour supprimer';
        } else if (error.message) {
            errorMsg = error.message;
        }

        deleteLocal('jobs', id);
        showToast(`${errorMsg} (supprimé en local)`, 'error');
        await loadJobsTable();
    }
}

async function handleJobFormSubmit(e) {
    e.preventDefault();

    console.log('📝 Job form submitted');

    const jobData = {
        title: document.getElementById('job-title').value.trim(),
        location: document.getElementById('job-location').value.trim(),
        contract_type: document.getElementById('job-contract').value,
        experience: document.getElementById('job-experience').value.trim(),
        description: document.getElementById('job-description').value.trim(),
        is_active: document.getElementById('job-active').checked
    };

    const id = document.getElementById('job-id').value;

    debugLog('Job Submit', { id, jobData });

    if (!jobData.title || !jobData.description) {
        showToast('Le titre et la description sont obligatoires', 'error');
        return;
    }

    try {
        let result;

        if (id) {
            console.log('🔄 Updating job ID:', id);
            result = await supabaseClient
                .from('jobs')
                .update(jobData)
                .eq('id', id)
                .select()
                .single();

            if (result.error) throw result.error;

            showToast('Offre mise à jour avec succès');
            console.log('✅ Job updated:', result.data);
        } else {
            console.log('➕ Creating new job');
            result = await supabaseClient
                .from('jobs')
                .insert([jobData])
                .select()
                .single();

            if (result.error) throw result.error;

            showToast('Offre créée avec succès');
            console.log('✅ Job created:', result.data);
        }

        closeJobModal();
        await loadJobsTable();
        await loadDashboardStats();

    } catch (error) {
        console.error('❌ Job error:', error);

        let errorMsg = 'Erreur lors de l\'enregistrement';
        if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes. Vérifiez vos droits d\'accès.';
        } else if (error.message) {
            errorMsg = error.message;
        }

        const offline = upsertLocal('jobs', jobData, id);
        showToast(`${errorMsg} (enregistré en local)`, 'error');
        closeJobModal();
        await loadJobsTable();
    }
}

// ==================== PRODUCTS MANAGEMENT ====================

async function loadProductsTable() {
    const container = document.getElementById('products-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    try {
        const products = await DataService.getProducts();
        document.getElementById('products-count-badge').textContent = `${products.length} produits`;

        if (products.length === 0) {
            container.innerHTML = '<p class="loading">Aucun produit pour le moment.</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Catégorie</th>
                        <th>Badge</th>
                        <th>En avant</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><strong>${escapeHtml(product.name)}</strong></td>
                            <td><span class="badge badge-info">${escapeHtml(product.category) || '-'}</span></td>
                            <td>${escapeHtml(product.badge) || '-'}</td>
                            <td>${product.is_featured ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-warning">Non</span>'}</td>
                            <td class="actions">
                                <button class="btn-icon edit" data-action="edit-product" data-id="${product.id}" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" data-action="delete-product" data-id="${product.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<p class="loading" style="color: #dc2626;">Erreur de chargement</p>';
        console.error(error);
    }
}

function openProductModal(productData = null) {
    switchSubtab('products', 'edit');
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';

    if (productData) {
        document.getElementById('product-id').value = productData.id;
        document.getElementById('product-name').value = productData.name;
        document.getElementById('product-category').value = productData.category || 'homme';
        document.getElementById('product-badge').value = productData.badge || '';
        document.getElementById('product-icon').value = productData.icon || 'fa-tshirt';
        document.getElementById('product-sort').value = productData.sort_order || 0;
        document.getElementById('product-gradient').value = productData.gradient || '';
        document.getElementById('product-description').value = productData.description || '';
        document.getElementById('product-featured').checked = !!productData.is_featured;
    }
}

function closeProductModal() {
    switchSubtab('products', 'list');
}

async function editProduct(id) {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error) throw error;

        const product = products.find(p => p.id === id);
        if (product) {
            openProductModal(product);
        } else {
            showToast('Produit introuvable', 'error');
        }
    } catch (error) {
        showToast('Erreur lors du chargement: ' + error.message, 'error');
    }
}

function confirmDeleteProduct(id) {
    deleteProductId = id;
    deleteType = 'product';
    document.getElementById('confirm-modal').classList.add('active');
}

async function deleteProduct(id) {
    console.log('🗑️ Deleting product ID:', id);

    try {
        const result = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id)
            .select();

        if (result.error) throw result.error;

        console.log('✅ Product deleted:', result.data);
        showToast('Produit supprimé avec succès');

        await loadProductsTable();
        await loadDashboardStats();

    } catch (error) {
        console.error('❌ Delete error:', error);

        let errorMsg = 'Erreur lors de la suppression';
        if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes pour supprimer';
        } else if (error.message) {
            errorMsg = error.message;
        }

        showToast(errorMsg, 'error');
    }
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    if (!validateCsrf()) {
        showToast('Session invalide. Veuillez rafraîchir la page.', 'error');
        return;
    }

    const productData = {
        name: sanitizeInput(document.getElementById('product-name').value),
        category: document.getElementById('product-category').value,
        badge: sanitizeInput(document.getElementById('product-badge').value) || null,
        icon: sanitizeInput(document.getElementById('product-icon').value) || 'fa-tshirt',
        sort_order: parseInt(document.getElementById('product-sort').value) || 0,
        gradient: sanitizeInput(document.getElementById('product-gradient').value),
        description: sanitizeInput(document.getElementById('product-description').value),
        is_featured: document.getElementById('product-featured').checked
    };

    const id = document.getElementById('product-id').value;

    try {
        if (id) {
            await rateLimitedRequest(() => DataService.updateProduct(id, productData));
            showToast('Produit mis à jour avec succès');
        } else {
            await rateLimitedRequest(() => DataService.createProduct(productData));
            showToast('Produit créé avec succès');
        }
        closeProductModal();
        loadProductsTable();
        loadDashboardStats();
    } catch (error) {
        if (error.message !== 'Rate limit exceeded') {
            showToast('Erreur: ' + error.message, 'error');
        }
    }
}

// ==================== SHOWROOM MANAGEMENT ====================

async function loadShowroomTable() {
    const container = document.getElementById('showroom-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    try {
        const items = await DataService.getShowroomItems();
        document.getElementById('showroom-count-badge').textContent = `${items.length} éléments`;

        if (items.length === 0) {
            container.innerHTML = '<p class="loading">Aucun élément dans le showroom.</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Titre</th>
                        <th>Catégorie</th>
                        <th>Ordre</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td><strong>${escapeHtml(item.title)}</strong></td>
                            <td><span class="badge badge-info">${escapeHtml(item.category) || '-'}</span></td>
                            <td>${item.sort_order || 0}</td>
                            <td class="actions">
                                <button class="btn-icon edit" data-action="edit-showroom" data-id="${item.id}" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" data-action="delete-showroom" data-id="${item.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<p class="loading" style="color: #dc2626;">Erreur de chargement</p>';
        console.error(error);
    }
}

function openShowroomModal(itemData = null) {
    document.getElementById('showroom-form').reset();
    document.getElementById('showroom-id').value = '';
    switchSubtab('showroom', 'edit');

    if (itemData) {
        document.getElementById('showroom-id').value = itemData.id;
        document.getElementById('showroom-title').value = itemData.title;
        document.getElementById('showroom-category').value = itemData.category || 'collection';
        document.getElementById('showroom-sort').value = itemData.sort_order || 0;
        document.getElementById('showroom-icon').value = itemData.icon || 'fa-image';
        document.getElementById('showroom-gradient').value = itemData.gradient || '';
        document.getElementById('showroom-description').value = itemData.description || '';
    }
}

function closeShowroomModal() {
    switchSubtab('showroom', 'list');
}

async function editShowroom(id) {
    try {
        const { data: items, error } = await supabaseClient
            .from('showroom')
            .select('*');

        if (error) throw error;

        const item = items.find(i => i.id === id);
        if (item) {
            openShowroomModal(item);
        } else {
            showToast('Élément introuvable', 'error');
        }
    } catch (error) {
        showToast('Erreur lors du chargement: ' + error.message, 'error');
    }
}

function confirmDeleteShowroom(id) {
    deleteShowroomId = id;
    deleteType = 'showroom';
    document.getElementById('confirm-modal').classList.add('active');
}

async function deleteShowroom(id) {
    console.log('🗑️ Deleting showroom item ID:', id);

    try {
        const result = await supabaseClient
            .from('showroom')
            .delete()
            .eq('id', id)
            .select();

        if (result.error) throw result.error;

        console.log('✅ Showroom item deleted:', result.data);
        showToast('Élément supprimé avec succès');

        await loadShowroomTable();

    } catch (error) {
        console.error('❌ Delete error:', error);

        let errorMsg = 'Erreur lors de la suppression';
        if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes pour supprimer';
        } else if (error.message) {
            errorMsg = error.message;
        }

        showToast(errorMsg, 'error');
    }
}

async function handleShowroomFormSubmit(e) {
    e.preventDefault();

    if (!validateCsrf()) {
        showToast('Session invalide. Veuillez rafraîchir la page.', 'error');
        return;
    }

    const itemData = {
        title: sanitizeInput(document.getElementById('showroom-title').value),
        category: document.getElementById('showroom-category').value,
        sort_order: parseInt(document.getElementById('showroom-sort').value) || 0,
        icon: sanitizeInput(document.getElementById('showroom-icon').value) || 'fa-image',
        gradient: sanitizeInput(document.getElementById('showroom-gradient').value),
        description: sanitizeInput(document.getElementById('showroom-description').value)
    };

    const id = document.getElementById('showroom-id').value;

    try {
        if (id) {
            await rateLimitedRequest(() => DataService.updateShowroomItem(id, itemData));
            showToast('Élément mis à jour avec succès');
        } else {
            await rateLimitedRequest(() => DataService.createShowroomItem(itemData));
            showToast('Élément créé avec succès');
        }
        closeShowroomModal();
        loadShowroomTable();
    } catch (error) {
        if (error.message !== 'Rate limit exceeded') {
            showToast('Erreur: ' + error.message, 'error');
        }
    }
}

// ==================== MESSAGES MANAGEMENT ====================

async function loadMessagesTable() {
    const container = document.getElementById('messages-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    try {
        const filter = document.getElementById('messages-filter')?.value || 'all';
        const messages = await DataService.getMessages(filter);

        document.getElementById('messages-count-badge').textContent = `${messages?.length || 0} messages`;

        if (!messages || messages.length === 0) {
            container.innerHTML = '<p class="loading">Aucun message pour le moment.</p>';
            return;
        }

        const formTypeLabels = {
            'contact': 'Contact',
            'quote': 'Devis',
            'application': 'Candidature',
            'suggestion': 'Suggestion'
        };

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${messages.map(msg => `
                        <tr ${msg.status === 'unread' ? 'class="unread-row"' : ''}>
                            <td>${formatDate(msg.created_at)}</td>
                            <td><span class="badge badge-info">${formTypeLabels[msg.form_type] || msg.form_type}</span></td>
                            <td><strong>${escapeHtml(msg.name)}</strong></td>
                            <td>${escapeHtml(msg.email)}</td>
                            <td>${msg.status === 'unread' ? '<span class="badge badge-warning">Non lu</span>' : '<span class="badge badge-success">Lu</span>'}</td>
                            <td class="actions">
                                <button class="btn-icon edit" data-action="view-message" data-id="${msg.id}" title="Voir">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon delete" data-action="delete-message" data-id="${msg.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<p class="loading" style="color: #dc2626;">Erreur de chargement</p>';
        console.error(error);
    }
}

async function viewMessage(id) {
    try {
        const message = await DataService.getMessage(id);

        if (message.status === 'unread') {
            await DataService.markMessageAsRead(id);
        }

        const formTypeLabels = {
            'contact': 'Contact',
            'quote': 'Demande de Devis',
            'application': 'Candidature',
            'suggestion': 'Suggestion'
        };

        document.getElementById('message-modal-title').textContent = formTypeLabels[message.form_type] || 'Message';
        
        let content = `
            <div class="message-detail-row">
                <strong>De:</strong> ${escapeHtml(message.name)} (${escapeHtml(message.email)})
            </div>
        `;

        if (message.phone) {
            content += `<div class="message-detail-row"><strong>Téléphone:</strong> ${escapeHtml(message.phone)}</div>`;
        }

        if (message.company) {
            content += `<div class="message-detail-row"><strong>Entreprise:</strong> ${escapeHtml(message.company)}</div>`;
        }

        if (message.subject) {
            content += `<div class="message-detail-row"><strong>Sujet:</strong> ${escapeHtml(message.subject)}</div>`;
        }

        if (message.job_id) {
            content += `<div class="message-detail-row"><strong>Poste:</strong> ${escapeHtml(message.job_id)}</div>`;
        }

        if (message.product_interest) {
            content += `<div class="message-detail-row"><strong>Produit:</strong> ${escapeHtml(message.product_interest)}</div>`;
        }

        if (message.quantity) {
            content += `<div class="message-detail-row"><strong>Quantité:</strong> ${escapeHtml(message.quantity)}</div>`;
        }

        content += `
            <div class="message-detail-row">
                <strong>Message:</strong>
                <p class="message-content-box">${escapeHtml(message.message) || 'Pas de message'}</p>
            </div>
        `;

        if (message.metadata && Object.keys(message.metadata).length > 0) {
            content += `
                <div class="message-detail-row">
                    <strong>Informations supplémentaires:</strong>
                    <pre class="message-metadata">${escapeHtml(JSON.stringify(message.metadata, null, 2))}</pre>
                </div>
            `;
        }

        content += `
            <div class="message-footer">
                <small class="text-muted">Reçu le ${formatDate(message.created_at)}</small>
            </div>
        `;

        document.getElementById('message-detail-content').innerHTML = content;
        document.getElementById('message-modal').classList.add('active');
        loadMessagesTable();

    } catch (error) {
        console.error('Error loading message:', error);
        showToast('Erreur lors du chargement du message', 'error');
    }
}

function closeMessageModal() {
    document.getElementById('message-modal').classList.remove('active');
}

function confirmDeleteMessage(id) {
    deleteMessageId = id;
    deleteType = 'message';
    document.getElementById('confirm-modal').classList.add('active');
}

async function deleteMessage(id) {
    console.log('🗑️ Deleting message ID:', id);

    try {
        const result = await supabaseClient
            .from('messages')
            .delete()
            .eq('id', id)
            .select();

        if (result.error) throw result.error;

        console.log('✅ Message deleted:', result.data);
        showToast('Message supprimé avec succès');

        await loadMessagesTable();

    } catch (error) {
        console.error('❌ Delete error:', error);

        let errorMsg = 'Erreur lors de la suppression';
        if (error.code === '42501') {
            errorMsg = 'Permissions insuffisantes pour supprimer';
        } else if (error.message) {
            errorMsg = error.message;
        }

        showToast(errorMsg, 'error');
    }
}

// ==================== CONFIRM DELETE MODAL ====================

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    deleteNewsId = null;
    deleteJobId = null;
    deleteProductId = null;
    deleteShowroomId = null;
    deleteMessageId = null;
    deleteType = null;
}

async function handleConfirmDelete() {
    console.log('🗑️ Confirm delete clicked', { deleteType, deleteNewsId, deleteJobId, deleteProductId });

    try {
        if (deleteType === 'news' && deleteNewsId) {
            await deleteNews(deleteNewsId);
        } else if (deleteType === 'job' && deleteJobId) {
            await deleteJob(deleteJobId);
        } else if (deleteType === 'product' && deleteProductId) {
            await deleteProduct(deleteProductId);
        } else if (deleteType === 'showroom' && deleteShowroomId) {
            await deleteShowroom(deleteShowroomId);
        } else if (deleteType === 'message' && deleteMessageId) {
            await deleteMessage(deleteMessageId);
        } else {
            console.error('❌ No valid delete target');
            showToast('Erreur: aucun élément à supprimer', 'error');
        }

        closeConfirmModal();

    } catch (error) {
        console.error('❌ Delete failed:', error);
        showToast('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

// ==================== SUB-TABS (INLINE EDITORS) ====================
function switchSubtab(section, tab) {
    // Toggle tab buttons
    const listTab = document.getElementById(`${section}-tab-list`);
    const editTab = document.getElementById(`${section}-tab-edit`);
    if (listTab && editTab) {
        listTab.classList.toggle('active', tab === 'list');
        editTab.classList.toggle('active', tab === 'edit');
    }
    // Show/hide editor panel
    const editor = document.getElementById(`${section}-editor`);
    if (editor) {
        editor.style.display = tab === 'edit' ? '' : 'none';
    }
}

// ==================== UTILITIES ====================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MAX_INPUT_LENGTH = 10000;

function sanitizeInput(str) {
    if (!str) return '';
    let result = String(str).trim();
    
    result = result.replace(/[<>]/g, '');
    
    let prevResult;
    do {
        prevResult = result;
        result = result.replace(/javascript\s*:/gi, '');
        result = result.replace(/vbscript\s*:/gi, '');
        result = result.replace(/data\s*:/gi, '');
    } while (result !== prevResult);
    
    do {
        prevResult = result;
        result = result.replace(/on\w+\s*=/gi, '');
    } while (result !== prevResult);
    
    return result.substring(0, MAX_INPUT_LENGTH);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadDashboardStats() {
    try {
        const [news, products, clients, jobsCount] = await Promise.all([
            DataService.getNews(),
            DataService.getProducts(),
            DataService.getClients(),
            DataService.getJobsCount()
        ]);

        const el1 = document.getElementById('stat-news-count');
        if (el1) el1.textContent = news.length;
        
        const el2 = document.getElementById('stat-products-count');
        if (el2) el2.textContent = products.length;
        
        const el3 = document.getElementById('stat-products-total');
        if (el3) el3.textContent = products.length;
        
        const el4 = document.getElementById('stat-clients-count');
        if (el4) el4.textContent = clients.length;
        
        const el5 = document.getElementById('stat-jobs-count');
        if (el5) el5.textContent = jobsCount;

        renderTrafficSalesChart();
    } catch (error) {
        console.error('Error loading stats:', error);
        renderTrafficSalesChart(); // still render with mock data
    }
}

let trafficChart = null;
function renderTrafficSalesChart() {
    const ctx = document.getElementById('traffic-sales-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    const labels = Array.from({ length: 10 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (9 - idx));
        return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    });

    const views = labels.map((_, i) => 800 + Math.round(Math.sin(i) * 120) + i * 25);
    const sales = labels.map((_, i) => 40 + Math.round(Math.cos(i) * 8) + i * 2);

    if (trafficChart) trafficChart.destroy();

    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Vues',
                    data: views,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Ventes',
                    data: sales,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    tension: 0.35,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ==================== DIAGNOSTIC FUNCTION ====================

async function testSupabaseConnection() {
    console.group('🔍 Supabase Connection Test');

    try {
        console.log('1. Supabase client:', typeof supabaseClient !== 'undefined' ? '✅' : '❌');

        const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
        console.log('2. Auth session:', session ? '✅' : '❌', session?.user?.email);
        if (authError) console.error('Auth error:', authError);

        const { data: newsData, error: newsError } = await supabaseClient
            .from('news')
            .select('count');
        console.log('3. Read news:', newsError ? '❌' : '✅');
        if (newsError) console.error('News read error:', newsError);

        const { data: jobsData, error: jobsError } = await supabaseClient
            .from('jobs')
            .select('count');
        console.log('4. Read jobs:', jobsError ? '❌' : '✅');
        if (jobsError) console.error('Jobs read error:', jobsError);

        console.log('5. Testing write permissions...');

        const testData = {
            title: '__TEST__',
            content: 'test',
            published_at: new Date().toISOString().split('T')[0]
        };

        const { data: insertTest, error: insertError } = await supabaseClient
            .from('news')
            .insert([testData])
            .select();

        if (!insertError && insertTest) {
            console.log('6. Write permission: ✅');
            await supabaseClient.from('news').delete().eq('title', '__TEST__');
        } else {
            console.log('6. Write permission: ���');
            console.error('Insert error:', insertError);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }

    console.groupEnd();
}

// ==================== GLOBAL EXPORTS ====================
// Minimal exports - event delegation handles most button clicks now
function exportToWindow() {
    // Modal functions (used by HTML buttons outside tables)
    window.openNewsModal = openNewsModal;
    window.closeNewsModal = closeNewsModal;
    window.openJobModal = openJobModal;
    window.closeJobModal = closeJobModal;
    window.openProductModal = openProductModal;
    window.closeProductModal = closeProductModal;
    window.openShowroomModal = openShowroomModal;
    window.closeShowroomModal = closeShowroomModal;
    window.closeMessageModal = closeMessageModal;
    window.closeConfirmModal = closeConfirmModal;
    
    // Navigation (used by sidebar links)
    window.switchSection = switchSection;
    
    // Utilities
    window.showToast = showToast;
    
    console.log('✅ Admin functions exported to window scope');
}

// Export immediately
try {
    exportToWindow();
} catch (e) {
    console.error('Failed to export functions:', e);
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('💥 Uncaught error:', event.error || event.message);
    try {
        showToast('Erreur: ' + (event.error?.message || event.message), 'error');
    } catch (_) {}
});

// ==================== INITIALIZATION ====================

function initEventListeners() {
    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await AuthManager.signOut();
            showToast('Déconnexion réussie');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (error) {
            showToast('Erreur lors de la déconnexion', 'error');
        }
    });

    // Form submissions
    document.getElementById('news-form')?.addEventListener('submit', handleNewsFormSubmit);
    document.getElementById('job-form')?.addEventListener('submit', handleJobFormSubmit);
    document.getElementById('product-form')?.addEventListener('submit', handleProductFormSubmit);
    document.getElementById('showroom-form')?.addEventListener('submit', handleShowroomFormSubmit);

    // Confirm delete button
    document.getElementById('confirm-delete-btn')?.addEventListener('click', handleConfirmDelete);

    // Quick action buttons
    document.getElementById('quick-add-news')?.addEventListener('click', () => {
        try {
            switchSection('news');
            openNewsModal();
        } catch (err) {
            console.error('Quick Add News failed:', err);
            showToast('Action indisponible: ' + err.message, 'error');
        }
    });

    document.getElementById('quick-add-job')?.addEventListener('click', () => {
        try {
            switchSection('jobs');
            openJobModal();
        } catch (err) {
            console.error('Quick Add Job failed:', err);
            showToast('Action indisponible: ' + err.message, 'error');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Admin panel initializing...');

    // Re-export functions to window (in case first attempt failed)
    try {
        exportToWindow();
        console.log('✅ Functions exported to window');
    } catch (e) {
        console.error('Failed to export functions:', e);
    }

    // Set up auth state change listener
    try {
        if (typeof AuthManager !== 'undefined' && AuthManager.onAuthStateChange) {
            AuthManager.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT') {
                    window.location.href = 'login.html';
                }
            });
        }
    } catch (e) {
        console.error('Auth state listener setup failed:', e);
    }

    // Check authentication first
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
        console.log('❌ Not logged in, redirecting...');
        return;
    }

    console.log('✅ User authenticated');

    // Initialize navigation
    initNavigation();
    
    // Initialize global event delegation (handles all button clicks)
    initGlobalEventListeners();

    // Initialize event listeners
    initEventListeners();

    // Run diagnostic
    await testSupabaseConnection();

    // Set current date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Load dashboard stats
    console.log('📊 Loading dashboard stats...');
    await loadDashboardStats();

    console.log('✅ Admin panel ready');
});

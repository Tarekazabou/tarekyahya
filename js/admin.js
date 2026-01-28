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
let deleteOrderId = null;
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
        // Handle row clicks for view-message
        const row = e.target.closest('tr[data-action="view-message"]');
        if (row && !e.target.closest('button') && !e.target.closest('a')) {
            const id = row.dataset.id;
            if (id) viewMessage(id);
            return;
        }

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

            // --- ORDERS ---
            case 'view-order':
                viewOrder(id); // UUID string, don't parse
                break;
            case 'delete-order':
                confirmDeleteOrder(id); // UUID string, don't parse
                break;

            // --- STORAGE ---
            case 'delete-storage-file':
                const path = btn.dataset.path;
                confirmDeleteStorageFile(path);
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
    if (sectionName === 'pipeline') loadPipeline();
    if (sectionName === 'sales-ledger') loadSalesLedger();
    if (sectionName === 'messages') loadMessagesTable();
    if (sectionName === 'storage') loadStorageStats();
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

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadNewsTable: Supabase not ready yet');
        container.innerHTML = '<p class="loading" style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Connexion en cours...</p>';
        return;
    }

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

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadJobsTable: Supabase not ready yet');
        container.innerHTML = '<p class="loading" style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Connexion en cours...</p>';
        return;
    }

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

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadProductsTable: Supabase not ready yet');
        container.innerHTML = '<p class="loading" style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Connexion en cours...</p>';
        return;
    }

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
    clearImagePreview();
    clearImagePreview2();
}

// Image preview for product upload
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', function (e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const preview = document.getElementById('image-preview');
                    const previewImg = document.getElementById('image-preview-img');
                    previewImg.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const imageInput2 = document.getElementById('product-image-2');
    if (imageInput2) {
        imageInput2.addEventListener('change', function (e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const preview = document.getElementById('image-preview-2');
                    const previewImg = document.getElementById('image-preview-img-2');
                    previewImg.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function clearImagePreview() {
    const imageInput = document.getElementById('product-image');
    const preview = document.getElementById('image-preview');
    if (imageInput) {
        imageInput.value = '';
    }
    if (preview) {
        preview.style.display = 'none';
    }
}

function clearImagePreview2() {
    const imageInput = document.getElementById('product-image-2');
    const preview = document.getElementById('image-preview-2');
    if (imageInput) {
        imageInput.value = '';
    }
    if (preview) {
        preview.style.display = 'none';
    }
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
        deleteProduct(id);
    }
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

// ==================== IMAGE OPTIMIZATION ====================

async function optimizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas with max dimensions
                const maxWidth = 1200;
                const maxHeight = 1200;
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions (maintain aspect ratio)
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        const optimizedFile = new File([blob], file.name, {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(optimizedFile);
                    },
                    'image/webp',
                    0.85 // Quality: 85% (good balance)
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ==================== IMAGE UPLOAD ====================

async function handleProductFormSubmit(e) {
    e.preventDefault();

    if (!validateCsrf()) {
        showToast('Session invalide. Veuillez rafraîchir la page.', 'error');
        return;
    }

    const submitBtn = document.getElementById('product-submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    let imageUrl = null;
    let imageUrl2 = null;
    const imageInput = document.getElementById('product-image');
    const imageInput2 = document.getElementById('product-image-2');
    const imageFile = imageInput.files[0];
    const imageFile2 = imageInput2.files[0];

    try {
        // Handle first image upload if a file is selected
        if (imageFile) {
            // Validate file size before optimization (5MB max)
            if (imageFile.size > 5 * 1024 * 1024) {
                showToast('L\'image 1 est trop volumineuse (max 5MB)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Validate file type
            if (!imageFile.type.startsWith('image/')) {
                showToast('Veuillez sélectionner une image valide pour l\'image 1', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Optimize image (resize + compress to WebP)
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimisation de l\'image 1...';
            let optimizedFile = imageFile;
            try {
                optimizedFile = await optimizeImage(imageFile);
                console.log(`📸 Image 1 optimisée: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`);
            } catch (optimizeError) {
                console.warn('⚠️ Could not optimize image 1, using original:', optimizeError);
            }

            // Upload optimized image to Supabase storage
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload de l\'image 1...';
            const fileName = `products/${Date.now()}-${sanitizeInput(document.getElementById('product-name').value).replace(/\s+/g, '-')}.webp`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('textile-images')
                .upload(fileName, optimizedFile, { upsert: false });

            if (uploadError) {
                throw new Error(`Erreur d'upload image 1: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('textile-images')
                .getPublicUrl(fileName);

            imageUrl = urlData.publicUrl;
        }

        // Handle second image upload if a file is selected
        if (imageFile2) {
            // Validate file size before optimization (5MB max)
            if (imageFile2.size > 5 * 1024 * 1024) {
                showToast('L\'image 2 est trop volumineuse (max 5MB)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Validate file type
            if (!imageFile2.type.startsWith('image/')) {
                showToast('Veuillez sélectionner une image valide pour l\'image 2', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Optimize image (resize + compress to WebP)
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimisation de l\'image 2...';
            let optimizedFile2 = imageFile2;
            try {
                optimizedFile2 = await optimizeImage(imageFile2);
                console.log(`📸 Image 2 optimisée: ${(imageFile2.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedFile2.size / 1024 / 1024).toFixed(2)}MB`);
            } catch (optimizeError) {
                console.warn('⚠️ Could not optimize image 2, using original:', optimizeError);
            }

            // Upload optimized image to Supabase storage
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload de l\'image 2...';
            const fileName2 = `products/${Date.now()}-alt-${sanitizeInput(document.getElementById('product-name').value).replace(/\s+/g, '-')}.webp`;

            const { data: uploadData2, error: uploadError2 } = await supabaseClient.storage
                .from('textile-images')
                .upload(fileName2, optimizedFile2, { upsert: false });

            if (uploadError2) {
                throw new Error(`Erreur d'upload image 2: ${uploadError2.message}`);
            }

            // Get public URL
            const { data: urlData2 } = supabaseClient.storage
                .from('textile-images')
                .getPublicUrl(fileName2);

            imageUrl2 = urlData2.publicUrl;
        }

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement du produit...';

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

        // Add image URLs if available
        if (imageUrl) {
            productData.image_url = imageUrl;
        }
        if (imageUrl2) {
            productData.image_url_2 = imageUrl2;
        }

        const id = document.getElementById('product-id').value;

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
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ==================== SHOWROOM MANAGEMENT ====================

async function loadShowroomTable() {
    const container = document.getElementById('showroom-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadShowroomTable: Supabase not ready yet');
        container.innerHTML = '<p class="loading" style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Connexion en cours...</p>';
        return;
    }

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

// Global variable for currently selected message
let selectedMessageId = null;

async function loadMessagesTable() {
    const container = document.getElementById('messages-table-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadMessagesTable: Supabase not ready yet');
        container.innerHTML = '<p class="loading" style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Connexion en cours...</p>';
        return;
    }

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

        // Render table
        container.innerHTML = `
            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 10;">
                    <tr>
                        <th style="width: 120px;">Date</th>
                        <th style="width: 250px;">Expéditeur</th>
                        <th style="width: 150px;">Type</th>
                        <th>Aperçu</th>
                        <th style="width: 60px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${messages.map(msg => `
                        <tr id="msg-row-${msg.id}" 
                            class="${msg.status === 'unread' ? 'unread-row' : ''} ${selectedMessageId === msg.id ? 'selected-row' : ''}" 
                            style="cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" 
                            data-action="view-message" 
                            data-id="${msg.id}">
                            
                            <td style="color: #64748b; font-size: 0.85rem;">${formatDate(msg.created_at)}</td>
                            <td>
                                <div style="font-weight: 600; color: #1e293b;">${escapeHtml(msg.name)}</div>
                                <div style="font-size: 0.85rem; color: #64748b;">${escapeHtml(msg.email)}</div>
                            </td>
                            <td>
                                <span class="badge" style="background: #e2e8f0; color: #475569;">${formTypeLabels[msg.form_type] || msg.form_type}</span>
                            </td>
                            <td style="color: #64748b; font-size: 0.9rem;">
                                <i class="fas fa-comment-alt" style="margin-right: 6px; color: #94a3b8;"></i>
                                ${escapeHtml(msg.message ? msg.message.substring(0, 60) + (msg.message.length > 60 ? '...' : '') : '(Aucun contenu)')}
                            </td>
                            <td>
                                <button class="btn-icon delete" 
                                        data-action="delete-message" 
                                        data-id="${msg.id}" 
                                        title="Supprimer">
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
    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('viewMessage: Supabase not ready yet');
        showToast('Connexion en cours...', 'warning');
        return;
    }

    try {
        // Highlight selection
        const rows = document.querySelectorAll('#messages-table-container tr');
        rows.forEach(r => {
            r.style.background = '';
            r.classList.remove('selected-row');
        });
        const selectedRow = document.getElementById(`msg-row-${id}`);
        if (selectedRow) {
            selectedRow.style.background = '#eff6ff'; // Light blue
            selectedRow.classList.remove('unread-row'); // Visually mark read immediately
            selectedRow.classList.add('selected-row');
        }
        selectedMessageId = id;

        // Show loading in reading pane
        const readingPane = document.getElementById('reading-pane-content');
        if (!readingPane) return; // Guard
        readingPane.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement du message...</div>';

        // Fetch data
        const message = await DataService.getMessage(id);

        if (!message) {
            readingPane.innerHTML = '<div class="error-state">Message introuvable</div>';
            return;
        }

        if (message.status === 'unread') {
            await DataService.markMessageAsRead(id);
        }

        // Prepare Delete button logic for reading pane
        const deleteBtn = document.getElementById('reading-pane-delete-btn');
        if (deleteBtn) {
            // Remove old listeners using clone (nuclear option but simplest here)
            const newBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);

            // Add new listener via delegation-compatible way or direct click
            newBtn.onclick = () => confirmDeleteMessage(id);

            const actionsDiv = document.getElementById('reading-pane-actions');
            if (actionsDiv) actionsDiv.style.display = 'block';
        }

        const formTypeLabels = {
            'contact': 'Contact',
            'quote': 'Demande de Devis',
            'application': 'Candidature',
            'suggestion': 'Suggestion'
        };

        // Build Content
        let content = `
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h1 style="margin: 0; font-size: 1.5rem; color: #1e293b;">
                        ${escapeHtml(message.subject || formTypeLabels[message.form_type] || 'Message')}
                    </h1>
                    <span style="color: #64748b; font-size: 0.9rem;">${formatDate(message.created_at)}</span>
                </div>

                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; gap: 1rem; align-items: center;">
                    <div style="width: 48px; height: 48px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #64748b; font-size: 1.2rem;">
                        ${message.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #0f172a;">${escapeHtml(message.name)}</div>
                        <div style="color: #3b82f6;">${escapeHtml(message.email)}</div>
                        ${message.phone ? `<div style="color: #64748b; font-size: 0.9rem;"><i class="fas fa-phone" style="font-size: 0.8rem;"></i> ${escapeHtml(message.phone)}</div>` : ''}
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1rem; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
                <div style="font-size: 1.1rem; line-height: 1.6; color: #334155; white-space: pre-wrap;">${escapeHtml(message.message || 'Pas de contenu texte.')}</div>
            </div>
        `;

        // Additional Metadata Grid
        if (message.metadata || message.company || message.product_interest || message.quantity) {
            content += `<div style="background: #fdfdfd; border: 1px solid #f1f5f9; border-radius: 8px; padding: 1.5rem; margin-top: 2rem;">
                <h4 style="margin-top: 0; margin-bottom: 1rem; color: #94a3b8;">Détails Supplémentaires</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">`;

            if (message.company) content += `<div><small style="color: #94a3b8; display: block;">Entreprise</small><strong>${escapeHtml(message.company)}</strong></div>`;
            if (message.product_interest) content += `<div><small style="color: #94a3b8; display: block;">Intérêt Produit</small><strong>${escapeHtml(message.product_interest)}</strong></div>`;
            if (message.quantity) content += `<div><small style="color: #94a3b8; display: block;">Quantité</small><strong>${escapeHtml(message.quantity)}</strong></div>`;
            if (message.form_type === 'application' && message.job_id) content += `<div><small style="color: #94a3b8; display: block;">Poste</small><strong>${escapeHtml(message.job_id)}</strong></div>`;

            if (message.metadata) {
                const meta = { ...message.metadata };
                delete meta.source; // filtering
                for (const [key, value] of Object.entries(meta)) {
                    if (value && typeof value !== 'object') {
                        content += `<div><small style="color: #94a3b8; display: block;">${key}</small><strong>${escapeHtml(String(value))}</strong></div>`;
                    }
                }
            }
            content += `</div></div>`;
        }

        // CV / File display
        if (message.metadata && message.metadata.cv_url) {
            content += `
                <div style="margin-top: 2rem;">
                    <a href="${escapeHtml(message.metadata.cv_url)}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-file-download"></i> Télécharger le CV / Fichier joint
                    </a>
                </div>
            `;
        }

        readingPane.innerHTML = content;

    } catch (error) {
        console.error('Error loading message details:', error);
        document.getElementById('reading-pane-content').innerHTML = `
            <div style="text-align: center; color: #dc2626; padding: 2rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Erreur lors du chargement du message.</p>
            </div>
        `;
    }
}

function closeMessageModal() {
    // Legacy function support - no longer needed for new layout but kept for safety
}

function confirmDeleteMessage(id) {
    if (confirm('Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.')) {
        deleteMessage(id);
    }
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

async function handleConfirmDelete() {
    console.log('🗑️ Handle Confirm Delete:', { deleteType, deleteProductId, deleteMessageId });

    if (!deleteType) return;

    try {
        switch (deleteType) {
            case 'message':
                if (deleteMessageId) await deleteMessage(deleteMessageId);
                break;
            case 'product':
                // Product delete is handled via direct confirm() now, but keeping for safety
                if (deleteProductId) await deleteProduct(deleteProductId);
                break;
            case 'news':
                if (window.deleteNewsId) await deleteNews(window.deleteNewsId);
                break;
            case 'job':
                if (window.deleteJobId) await deleteJob(window.deleteJobId);
                break;
            case 'showroom':
                if (window.deleteShowroomId) await deleteShowroom(window.deleteShowroomId);
                break;
            case 'order':
                if (window.deleteOrderId) await deleteOrder(window.deleteOrderId);
                break;
            case 'storage-file':
                // Handled directly via confirm()
                break;
        }

        closeConfirmModal();

    } catch (error) {
        console.error('❌ Delete failed:', error);
        showToast('Erreur lors de la suppression', 'error');
        closeConfirmModal();
    }
}


// ==================== ORDERS MANAGEMENT ====================

async function loadOrdersTable() {
    const container = document.getElementById('orders-table-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        document.getElementById('orders-count-badge').textContent = `${orders?.length || 0} commandes`;

        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="loading">Aucune commande pour le moment.</p>';
            return;
        }

        const statusLabels = {
            'pending': { text: 'En attente', color: 'warning' },
            'confirmed': { text: 'Confirmée', color: 'success' },
            'shipped': { text: 'Expédiée', color: 'info' },
            'delivered': { text: 'Livrée', color: 'success' },
            'cancelled': { text: 'Annulée', color: 'danger' }
        };

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Numéro</th>
                        <th>Client</th>
                        <th>Email</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => {
            const status = statusLabels[order.status] || { text: order.status || 'Inconnu', color: 'secondary' };
            return `
                        <tr>
                            <td><strong>${escapeHtml(order.order_number)}</strong></td>
                            <td>${escapeHtml(order.client_name)}</td>
                            <td>${escapeHtml(order.client_email || '-')}</td>
                            <td>€ ${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                            <td><span class="badge badge-${status.color}">${status.text}</span></td>
                            <td>${formatDate(order.created_at)}</td>
                            <td class="actions">
                                <button class="btn-icon edit" data-action="view-order" data-id="${order.id}" title="Voir">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon delete" data-action="delete-order" data-id="${order.id}" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<p class="loading" style="color: #dc2626;">Erreur de chargement</p>';
        console.error(error);
    }
}

async function viewOrder(id) {
    try {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const statusLabels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
        };

        let content = `
            <div class="message-detail-row">
                <strong>Numéro de commande:</strong> ${escapeHtml(order.order_number)}
            </div>
            <div class="message-detail-row">
                <strong>Client:</strong> ${escapeHtml(order.client_name)}
            </div>
            <div class="message-detail-row">
                <strong>Email:</strong> ${escapeHtml(order.client_email || '-')}
            </div>
            <div class="message-detail-row">
                <strong>Téléphone:</strong> ${escapeHtml(order.client_phone || '-')}
            </div>
            <div class="message-detail-row">
                <strong>Entreprise:</strong> ${escapeHtml(order.client_company || '-')}
            </div>
            <div class="message-detail-row">
                <strong>Produit intéressé:</strong> ${escapeHtml(order.product_interest || '-')}
            </div>
            <div class="message-detail-row">
                <strong>Quantité:</strong> ${order.quantity || '-'}
            </div>
            <div class="message-detail-row">
                <strong>Montant total:</strong> € ${parseFloat(order.total_amount || 0).toFixed(2)}
            </div>
            <div class="message-detail-row">
                <strong>Statut:</strong> ${statusLabels[order.status] || order.status}
            </div>
            <div class="message-detail-row">
                <strong>Message:</strong>
                <p class="message-content-box">${escapeHtml(order.message) || 'Pas de message'}</p>
            </div>
            <div class="message-footer">
                <small class="text-muted">Créée le ${formatDate(order.created_at)}</small>
            </div>
        `;

        document.getElementById('message-modal-title').textContent = 'Détail de la Commande';
        document.getElementById('message-detail-content').innerHTML = content;
        document.getElementById('message-modal').classList.add('active');

    } catch (error) {
        console.error('Error loading order:', error);
        showToast('Erreur lors du chargement de la commande', 'error');
    }
}

function confirmDeleteOrder(id) {
    deleteOrderId = id;
    deleteType = 'order';
    document.getElementById('confirm-modal').classList.add('active');
}

async function deleteOrder(id) {
    console.log('🗑️ Deleting order ID:', id);

    try {
        const result = await supabaseClient
            .from('orders')
            .delete()
            .eq('id', id)
            .select();

        if (result.error) throw result.error;

        console.log('✅ Order deleted:', result.data);
        showToast('Commande supprimée avec succès');
        await loadOrdersTable();
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

function exportOrdersToCSV() {
    try {
        supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .then(({ data: orders, error }) => {
                if (error) throw error;

                if (!orders || orders.length === 0) {
                    showToast('Aucune commande à exporter', 'warning');
                    return;
                }

                const headers = ['Numéro', 'Client', 'Email', 'Téléphone', 'Entreprise', 'Produit', 'Quantité', 'Montant', 'Statut', 'Date', 'Message'];
                const csv = [
                    headers.join(','),
                    ...orders.map(order => [
                        `"${order.order_number}"`,
                        `"${order.client_name}"`,
                        `"${order.client_email || ''}"`,
                        `"${order.client_phone || ''}"`,
                        `"${order.client_company || ''}"`,
                        `"${order.product_interest || ''}"`,
                        order.quantity || '',
                        order.total_amount || 0,
                        order.status || '',
                        `"${new Date(order.created_at).toLocaleDateString('fr-FR')}"`,
                        `"${(order.message || '').replace(/"/g, '""')}"`
                    ].join(','))
                ].join('\n');

                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `commandes-${new Date().toISOString().split('T')[0]}.csv`);
                link.click();

                showToast('Commandes exportées avec succès');
            });
    } catch (error) {
        console.error('Export error:', error);
        showToast('Erreur lors de l\'export', 'error');
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
    deleteOrderId = null;
    deleteType = null;
}

// ==================== PIPELINE (KANBAN) MANAGEMENT ====================

let currentLeadId = null;
let allLeads = [];

async function loadPipeline() {
    const statuses = ['new', 'contacted', 'negotiating', 'won', 'lost'];
    const filter = document.getElementById('pipeline-filter')?.value || 'all';

    // Show loading state in all columns
    statuses.forEach(status => {
        const container = document.getElementById(`cards-${status}`);
        if (container) {
            container.innerHTML = '<div class="kanban-loading"><i class="fas fa-spinner fa-spin"></i></div>';
        }
    });

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadPipeline: Supabase not ready yet');
        statuses.forEach(status => {
            const container = document.getElementById(`cards-${status}`);
            if (container) {
                container.innerHTML = '<div class="kanban-empty"><i class="fas fa-exclamation-triangle"></i><p>Connexion en cours...</p></div>';
            }
        });
        showToast('Connexion en cours...', 'warning');
        return;
    }

    try {
        // Fetch all orders (leads) from database
        let query = supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: leads, error } = await query;

        if (error) throw error;

        allLeads = leads || [];

        // Apply filters
        let filteredLeads = [...allLeads];

        if (filter === 'vip') {
            filteredLeads = filteredLeads.filter(l => l.lead_tags?.includes('vip') || l.lead_tags?.includes('high_potential'));
        } else if (filter === 'wholesale') {
            filteredLeads = filteredLeads.filter(l => l.lead_tags?.includes('wholesale'));
        } else if (filter === 'this-week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filteredLeads = filteredLeads.filter(l => new Date(l.created_at) >= oneWeekAgo);
        }

        // Group by lead_status (with fallback to 'new')
        const grouped = {
            new: [],
            contacted: [],
            negotiating: [],
            won: [],
            lost: []
        };

        filteredLeads.forEach(lead => {
            const status = lead.lead_status || 'new';
            if (grouped[status]) {
                grouped[status].push(lead);
            } else {
                grouped.new.push(lead);
            }
        });

        // Render each column
        Object.keys(grouped).forEach(status => {
            renderKanbanColumnV2(status, grouped[status]);
        });

        // Update counts
        document.getElementById('count-new').textContent = grouped.new.length;
        document.getElementById('count-contacted').textContent = grouped.contacted.length;
        document.getElementById('count-negotiating').textContent = grouped.negotiating.length;
        document.getElementById('count-won').textContent = grouped.won.length;
        document.getElementById('count-lost').textContent = grouped.lost.length;

        // Initialize drag and drop
        initKanbanDragDrop();

    } catch (error) {
        console.error('Error loading pipeline:', error);
        showToast('Erreur lors du chargement du pipeline', 'error');

        // CRITICAL: Clear loading spinners to show error state
        ['new', 'contacted', 'negotiating', 'won', 'lost'].forEach(status => {
            const container = document.getElementById(`cards-${status}`);
            if (container) {
                container.innerHTML = '<div class="kanban-empty"><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i><p>Erreur de chargement</p></div>';
            }
        });
    }
}

function renderKanbanColumn(status, leads) {
    const container = document.getElementById(`cards-${status}`);
    if (!container) return;

    if (leads.length === 0) {
        container.innerHTML = `
            <div class="kanban-empty">
                <i class="fas fa-inbox"></i>
                <p>Aucun lead</p>
            </div>
        `;
        return;
    }

    container.innerHTML = leads.map(lead => {
        const tags = lead.lead_tags || [];
        const isVip = tags.includes('vip') || tags.includes('high_potential');
        const isWholesale = tags.includes('wholesale');

        return `
            <div class="lead-card ${isVip ? 'vip' : ''} ${isWholesale ? 'wholesale' : ''}" 
                 data-id="${lead.id}" 
                 draggable="true">
                <div class="lead-card-header">
                    <span class="lead-card-name">${escapeHtml(lead.client_name)}</span>
                    <div class="lead-card-tags">
                        ${isVip ? '<span class="lead-tag vip">🌟 VIP</span>' : ''}
                        ${isWholesale ? '<span class="lead-tag wholesale">🏢 Grossiste</span>' : ''}
                    </div>
                </div>
                <div class="lead-card-product">
                    <i class="fas fa-box"></i>
                    ${escapeHtml(lead.product_interest || 'Non spécifié')}
                    ${lead.quantity ? `<span style="color: #3b82f6;">(x${lead.quantity})</span>` : ''}
                </div>
                
                <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 2px;">
                    ${lead.client_phone ? `<span><i class="fas fa-phone-alt" style="font-size: 0.75rem; margin-right: 4px;"></i> ${escapeHtml(lead.client_phone)}</span>` : ''}
                    ${lead.client_email ? `<span><i class="fas fa-envelope" style="font-size: 0.75rem; margin-right: 4px;"></i> ${escapeHtml(lead.client_email)}</span>` : ''}
                </div>

                ${lead.message ? `
                    <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #475569; font-style: italic; border-left: 2px solid #cbd5e1; padding-left: 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        "${escapeHtml(lead.message)}"
                    </div>
                ` : ''}

                ${status === 'won' && lead.final_sale_price ? `
                    <div style="margin-top: 0.5rem;">
                        <span class="lead-sale-amount">TND ${formatNumber(lead.final_sale_price)}</span>
                    </div>
                ` : ''}
                <!-- Expanded Details (Hidden by default) -->
                <div class="lead-card-details" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <div style="font-size: 0.9rem; color: #334155; white-space: pre-wrap; margin-bottom: 1rem;">${escapeHtml(lead.message || 'Pas de message')}</div>
                    
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewLead('${lead.id}')">
                            <i class="fas fa-edit"></i> Gérer
                        </button>
                    </div>
                </div>

                <div class="lead-card-footer">
                    <span>${formatDate(lead.created_at)}</span>
                    <div class="lead-card-actions">
                        ${lead.client_phone ? `
                            <button class="whatsapp" onclick="event.stopPropagation(); openWhatsApp('${lead.client_phone}')" title="WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        ` : ''}
                        <button onclick="event.stopPropagation(); toggleLeadCard(this, '${lead.id}')" title="Aperçu rapide">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.lead-card').forEach(card => {
        card.addEventListener('click', () => {
            viewLead(card.dataset.id);
        });
    });
}

function toggleLeadCard(btn, id) {
    const card = btn.closest('.lead-card');
    const details = card.querySelector('.lead-card-details');
    const icon = btn.querySelector('i');

    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        card.style.background = '#f8fafc'; // Highlight expanded
    } else {
        details.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        card.style.background = ''; // Reset
    }
}

function initKanbanDragDrop() {
    const cards = document.querySelectorAll('.lead-card');
    const columns = document.querySelectorAll('.kanban-column');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            columns.forEach(col => col.classList.remove('drag-over'));
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');

            const leadId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;

            // If dropping on 'won' column, show Win Wizard
            if (newStatus === 'won') {
                const lead = allLeads.find(l => l.id === leadId);
                if (lead) {
                    openWinWizard(lead);
                }
            } else {
                await updateLeadStatus(leadId, newStatus);
            }
        });
    });
}

async function viewLead(id) {
    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('viewLead: Supabase not ready yet');
        showToast('Connexion en cours...', 'warning');
        return;
    }

    try {
        const { data: lead, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        currentLeadId = id;

        const statusLabels = {
            'new': '🆕 Nouveau',
            'contacted': '📞 Contacté',
            'negotiating': '⏳ En Négociation',
            'won': '✅ Gagné',
            'lost': '❌ Perdu'
        };

        let content = `
            <div class="lead-detail-row">
                <span class="lead-detail-label">Statut:</span>
                <span class="lead-detail-value"><strong>${statusLabels[lead.lead_status || 'new']}</strong></span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Client:</span>
                <span class="lead-detail-value">${escapeHtml(lead.client_name)}</span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Email:</span>
                <span class="lead-detail-value">${escapeHtml(lead.client_email || '-')}</span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Téléphone:</span>
                <span class="lead-detail-value">${escapeHtml(lead.client_phone || '-')}</span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Entreprise:</span>
                <span class="lead-detail-value">${escapeHtml(lead.client_company || '-')}</span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Produit:</span>
                <span class="lead-detail-value">${escapeHtml(lead.product_interest || '-')}</span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Quantité:</span>
                <span class="lead-detail-value">${lead.quantity || '-'}</span>
            </div>
            <div class="lead-detail-row">
                <span class="lead-detail-label">Message:</span>
                <span class="lead-detail-value">${escapeHtml(lead.message || 'Pas de message')}</span>
            </div>
        `;

        if (lead.lead_status === 'won' && lead.final_sale_price) {
            content += `
                <div class="lead-detail-row" style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <span class="lead-detail-label" style="color: #16a34a;">💰 Vente:</span>
                    <span class="lead-detail-value" style="color: #16a34a; font-weight: 600;">TND ${formatNumber(lead.final_sale_price)}</span>
                </div>
                ${lead.sale_notes ? `
                    <div class="lead-detail-row">
                        <span class="lead-detail-label">Notes:</span>
                        <span class="lead-detail-value">${escapeHtml(lead.sale_notes)}</span>
                    </div>
                ` : ''}
                ${lead.salesperson ? `
                    <div class="lead-detail-row">
                        <span class="lead-detail-label">Vendeur:</span>
                        <span class="lead-detail-value">${escapeHtml(lead.salesperson)}</span>
                    </div>
                ` : ''}
            `;
        }

        content += `
            <div class="lead-detail-row">
                <span class="lead-detail-label">Créé le:</span>
                <span class="lead-detail-value">${formatDate(lead.created_at)}</span>
            </div>
        `;

        document.getElementById('lead-modal-title').textContent = `Lead: ${lead.client_name}`;
        document.getElementById('lead-detail-content').innerHTML = content;

        // Update quick action links
        const phone = lead.client_phone?.replace(/[^0-9+]/g, '');
        document.getElementById('lead-whatsapp-link').href = phone ? `https://wa.me/${phone.replace('+', '')}` : '#';
        document.getElementById('lead-email-link').href = lead.client_email ? `mailto:${lead.client_email}` : '#';
        document.getElementById('lead-phone-link').href = phone ? `tel:${phone}` : '#';

        // Show/hide status buttons based on current status
        const currentStatus = lead.lead_status || 'new';
        document.getElementById('btn-status-contacted').style.display = currentStatus === 'new' ? '' : 'none';
        document.getElementById('btn-status-negotiating').style.display = ['new', 'contacted'].includes(currentStatus) ? '' : 'none';
        document.getElementById('btn-status-won').style.display = !['won', 'lost'].includes(currentStatus) ? '' : 'none';
        document.getElementById('btn-status-lost').style.display = !['won', 'lost'].includes(currentStatus) ? '' : 'none';

        document.getElementById('lead-detail-modal').classList.add('active');

    } catch (error) {
        console.error('Error loading lead:', error);
        showToast('Erreur lors du chargement du lead', 'error');
    }
}

function closeLeadModal() {
    document.getElementById('lead-detail-modal').classList.remove('active');
    currentLeadId = null;
}

async function changeLeadStatus(newStatus) {
    if (!currentLeadId) return;

    // If changing to 'won', show Win Wizard
    if (newStatus === 'won') {
        const lead = allLeads.find(l => l.id === currentLeadId);
        closeLeadModal();
        if (lead) {
            openWinWizard(lead);
        }
        return;
    }

    await updateLeadStatus(currentLeadId, newStatus);
    closeLeadModal();
}

async function updateLeadStatus(leadId, newStatus) {
    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('updateLeadStatus: Supabase not ready yet');
        showToast('Connexion en cours...', 'warning');
        return;
    }

    try {
        const updateData = {
            lead_status: newStatus,
            updated_at: new Date().toISOString()
        };

        if (newStatus === 'lost') {
            updateData.closed_at = new Date().toISOString();
        }

        const { error } = await supabaseClient
            .from('orders')
            .update(updateData)
            .eq('id', leadId);

        if (error) throw error;

        showToast(`Lead mis à jour: ${newStatus}`);
        await loadPipeline();
        await loadDashboardStats();

    } catch (error) {
        console.error('Error updating lead:', error);
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

// ==================== WIN WIZARD ====================

function openWinWizard(lead) {
    document.getElementById('win-lead-id').value = lead.id;
    document.getElementById('win-client-name').value = lead.client_name;
    document.getElementById('win-products').value = lead.product_interest || 'Non spécifié';
    document.getElementById('win-final-price').value = '';
    document.getElementById('win-salesperson').value = '';
    document.getElementById('win-notes').value = '';

    document.getElementById('win-wizard-modal').classList.add('active');
}

function closeWinWizard() {
    document.getElementById('win-wizard-modal').classList.remove('active');
}

async function handleWinWizardSubmit(e) {
    e.preventDefault();

    const leadId = document.getElementById('win-lead-id').value;
    const finalPrice = parseFloat(document.getElementById('win-final-price').value);
    const salesperson = document.getElementById('win-salesperson').value.trim();
    const notes = document.getElementById('win-notes').value.trim();

    if (!finalPrice || finalPrice <= 0) {
        showToast('Veuillez entrer un montant valide', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({
                lead_status: 'won',
                final_sale_price: finalPrice,
                salesperson: salesperson || null,
                sale_notes: notes || null,
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;

        showToast('🎉 Vente enregistrée avec succès!');
        closeWinWizard();
        await loadPipeline();
        await loadDashboardStats();

    } catch (error) {
        console.error('Error recording sale:', error);
        showToast('Erreur lors de l\'enregistrement', 'error');
    }
}

// ==================== SALES LEDGER ====================



function exportSalesLedgerToCSV() {
    supabaseClient
        .from('orders')
        .select('*')
        .eq('lead_status', 'won')
        .not('final_sale_price', 'is', null)
        .order('closed_at', { ascending: false })
        .then(({ data: sales, error }) => {
            if (error) throw error;

            if (!sales || sales.length === 0) {
                showToast('Aucune vente à exporter', 'warning');
                return;
            }

            const headers = ['Date', 'Client', 'Entreprise', 'Email', 'Téléphone', 'Produit', 'Quantité', 'Montant (TND)', 'Vendeur', 'Notes'];
            const csv = [
                headers.join(','),
                ...sales.map(sale => [
                    `"${new Date(sale.closed_at).toLocaleDateString('fr-FR')}"`,
                    `"${sale.client_name}"`,
                    `"${sale.client_company || ''}"`,
                    `"${sale.client_email || ''}"`,
                    `"${sale.client_phone || ''}"`,
                    `"${sale.product_interest || ''}"`,
                    sale.quantity || '',
                    sale.final_sale_price || 0,
                    `"${sale.salesperson || ''}"`,
                    `"${(sale.sale_notes || '').replace(/"/g, '""')}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `registre-ventes-${new Date().toISOString().split('T')[0]}.csv`);
            link.click();

            showToast('Registre exporté avec succès');
        })
        .catch(error => {
            console.error('Export error:', error);
            showToast('Erreur lors de l\'export', 'error');
        });
}

function exportPipelineToCSV() {
    supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data: leads, error }) => {
            if (error) throw error;

            if (!leads || leads.length === 0) {
                showToast('Aucun lead à exporter', 'warning');
                return;
            }

            const statusLabels = {
                'new': 'Nouveau',
                'contacted': 'Contacté',
                'negotiating': 'En Négociation',
                'won': 'Gagné',
                'lost': 'Perdu'
            };

            const headers = ['Date', 'Statut', 'Client', 'Email', 'Téléphone', 'Entreprise', 'Produit', 'Quantité', 'Montant Vente', 'Message'];
            const csv = [
                headers.join(','),
                ...leads.map(lead => [
                    `"${new Date(lead.created_at).toLocaleDateString('fr-FR')}"`,
                    `"${statusLabels[lead.lead_status || 'new']}"`,
                    `"${lead.client_name}"`,
                    `"${lead.client_email || ''}"`,
                    `"${lead.client_phone || ''}"`,
                    `"${lead.client_company || ''}"`,
                    `"${lead.product_interest || ''}"`,
                    lead.quantity || '',
                    lead.final_sale_price || '',
                    `"${(lead.message || '').replace(/"/g, '""')}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `pipeline-${new Date().toISOString().split('T')[0]}.csv`);
            link.click();

            showToast('Pipeline exporté avec succès');
        })
        .catch(error => {
            console.error('Export error:', error);
            showToast('Erreur lors de l\'export', 'error');
        });
}

function openWhatsApp(phone) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '').replace('+', '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
}

function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(num);
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
        // Fetch all data in parallel
        const [news, products, jobs, messages, showroom, pipelineData, visitorStats, orderStats, detailedVisitorStats] = await Promise.all([
            DataService.getNews(),
            DataService.getProducts(),
            DataService.getAllJobs().catch(() => []),
            DataService.getMessages().catch(() => []),
            DataService.getShowroomItems().catch(() => []),
            loadPipelineStats().catch(() => null),
            DataService.getVisitorStats().catch(() => null),
            DataService.getOrderStats().catch(() => null),
            DataService.getDetailedVisitorStats().catch(() => null)
        ]);

        // Helper function to safely update element
        const updateEl = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        // Helper function to update element with HTML
        const updateElHtml = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        // Helper function to format number with separator
        const formatNum = (num) => {
            return new Intl.NumberFormat('fr-FR').format(num);
        };

        // === Quick Stats Row ===
        updateEl('stat-news-count', news.length);
        updateEl('stat-jobs-count', jobs.length);
        updateEl('stat-messages-count', messages.length);

        // === Visitor Statistics (Activité Générale) ===
        // Use detailedVisitorStats for accurate session data
        const vStats = detailedVisitorStats || visitorStats;
        if (vStats) {
            // Total Visitors (unique)
            const totalVisitors = vStats.totalVisitors || vStats.uniqueVisitors || 0;
            updateEl('stat-total-visitors', formatNum(totalVisitors));
            updateEl('stat-detail-visitors', formatNum(totalVisitors));

            // Total Page Views
            const totalPageViews = vStats.totalPageViews || vStats.totalViews || 0;
            updateEl('stat-total-pageviews', formatNum(totalPageViews));
            updateEl('stat-detail-pages', formatNum(totalPageViews));

            // Today's Visitors
            const todayVisitors = vStats.visitorsToday || vStats.todayViews || 0;
            updateEl('stat-detail-today', formatNum(todayVisitors));

            // New Visitors
            const newVisitors = vStats.newVisitors || 0;
            updateEl('stat-detail-new', formatNum(newVisitors));

            // Sessions (accurate from detailedVisitorStats)
            const sessions = vStats.totalSessions || Math.round((visitorStats?.weekViews || 0) / 3);
            updateEl('stat-detail-sessions', formatNum(sessions));

            // Pages per session
            const pagesPerSession = vStats.avgPagesPerSession ||
                (totalVisitors > 0 ? (totalPageViews / totalVisitors).toFixed(2) : '0.00');
            updateEl('stat-pages-per-session', pagesPerSession);

            // Calculate visitor growth trends
            if (visitorStats) {
                const weekViews = visitorStats.weekViews || 0;
                const monthViews = visitorStats.monthViews || 1;
                const visitorTrend = weekViews > 0 ? Math.round((weekViews / monthViews) * 100 * 4) : 0;
                updateElHtml('stat-visitors-change', `<i class="fas fa-arrow-up"></i> +${Math.min(visitorTrend, 9999)}%`);

                const todayViews = visitorStats.todayViews || 0;
                const pagesTrend = todayViews > 0 ? Math.round((todayViews / Math.max(weekViews, 1)) * 100 * 7) : 0;
                updateElHtml('stat-pageviews-change', `<i class="fas fa-arrow-up"></i> +${Math.min(pagesTrend, 9999)}%`);
            }
        }

        // === Order Statistics ===
        if (orderStats) {
            updateEl('stat-total-orders', formatNum(orderStats.totalOrders || 0));

            // Order trend
            const orderTrend = orderStats.trendPercent || 0;
            const trendIcon = orderTrend >= 0 ? 'arrow-up' : 'arrow-down';
            const trendSign = orderTrend >= 0 ? '+' : '';
            updateElHtml('stat-orders-change', `<i class="fas fa-${trendIcon}"></i> ${trendSign}${orderTrend}%`);

            // Conversion rate (visitors to orders)
            if (visitorStats && visitorStats.uniqueVisitors > 0) {
                const conversionRate = ((orderStats.totalOrders || 0) / visitorStats.uniqueVisitors * 100).toFixed(2);
                updateEl('stat-conversion-rate', `${conversionRate}%`);
            }
        }

        // === Pipeline Stats (Lead Management) ===
        if (pipelineData) {
            // Fresh Leads (new this week)
            updateEl('stat-fresh-leads', pipelineData.freshLeads);

            // Response Rate
            const responseRate = pipelineData.totalLeads > 0
                ? Math.round((pipelineData.contactedLeads / pipelineData.totalLeads) * 100)
                : 0;
            updateEl('stat-response-rate', `${responseRate}%`);

            // Pipeline Health (negotiating)
            updateEl('stat-pipeline-health', pipelineData.negotiatingLeads);

            // Win Rate (Conversion)
            const winRate = pipelineData.totalLeads > 0
                ? Math.round((pipelineData.wonLeads / pipelineData.totalLeads) * 100)
                : 0;
            updateEl('stat-win-rate', `${winRate}%`);
            updateEl('stat-deals-won', `${pipelineData.wonLeads} ventes`);

            // Total leads
            updateEl('stat-total-leads', pipelineData.totalLeads);

            // Sales Summary
            updateEl('stat-revenue-total', `TND ${formatNum(pipelineData.totalRevenue)}`);
            updateEl('stat-avg-deal', `TND ${formatNum(pipelineData.avgDeal)}`);
            updateEl('stat-sales-month', pipelineData.salesThisMonth);

            // Tag counts
            updateEl('tag-vip-count', pipelineData.vipCount || 0);
            updateEl('tag-wholesale-count', pipelineData.wholesaleCount || 0);
            updateEl('tag-individual-count', pipelineData.individualCount || 0);

            // Load top requested products
            await loadTopRequestedProducts();

            // Load recent wins
            await loadRecentWins();
        }

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadPipelineStats() {
    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadPipelineStats: Supabase not ready yet');
        return null;
    }

    try {
        const { data: leads, error } = await supabaseClient
            .from('orders')
            .select('*');

        if (error) throw error;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Calculate stats
        const freshLeads = leads.filter(l => new Date(l.created_at) >= oneWeekAgo && (l.lead_status === 'new' || !l.lead_status)).length;
        const contactedLeads = leads.filter(l => ['contacted', 'negotiating', 'won'].includes(l.lead_status)).length;
        const negotiatingLeads = leads.filter(l => l.lead_status === 'negotiating').length;
        const wonLeads = leads.filter(l => l.lead_status === 'won').length;
        const lostLeads = leads.filter(l => l.lead_status === 'lost').length;

        // Revenue from won deals
        const wonDeals = leads.filter(l => l.lead_status === 'won' && l.final_sale_price);
        const totalRevenue = wonDeals.reduce((sum, l) => sum + parseFloat(l.final_sale_price || 0), 0);
        const avgDeal = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

        // Sales this month
        const salesThisMonth = wonDeals.filter(l => l.closed_at && new Date(l.closed_at) >= startOfMonth).length;

        // Tag counts
        const vipCount = leads.filter(l => l.lead_tags?.includes('vip') || l.lead_tags?.includes('high_potential')).length;
        const wholesaleCount = leads.filter(l => l.lead_tags?.includes('wholesale')).length;
        const individualCount = leads.length - wholesaleCount;

        return {
            totalLeads: leads.length,
            freshLeads,
            contactedLeads,
            negotiatingLeads,
            wonLeads,
            lostLeads,
            totalRevenue,
            avgDeal,
            salesThisMonth,
            vipCount,
            wholesaleCount,
            individualCount
        };
    } catch (error) {
        console.error('Error loading pipeline stats:', error);
        return null;
    }
}

async function loadTopRequestedProducts() {
    const container = document.getElementById('top-requested-products');
    if (!container) return;

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        container.innerHTML = '<p style="color: #f59e0b; text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Connexion...</p>';
        return;
    }

    try {
        const { data: leads, error } = await supabaseClient
            .from('orders')
            .select('product_interest')
            .not('product_interest', 'is', null);

        if (error) throw error;

        // Count product interests
        const productCounts = {};
        leads.forEach(lead => {
            const product = lead.product_interest?.trim();
            if (product) {
                productCounts[product] = (productCounts[product] || 0) + 1;
            }
        });

        // Sort by count
        const sorted = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sorted.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 1rem;">Aucune demande</p>';
            return;
        }

        container.innerHTML = sorted.map(([product, count], index) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; ${index < sorted.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
                <span style="color: #374151;">${escapeHtml(product)}</span>
                <span class="badge badge-info">${count} demandes</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading top products:', error);
        container.innerHTML = '<p style="color: #dc2626; text-align: center; padding: 1rem;">Erreur</p>';
    }
}

async function loadRecentWins() {
    const container = document.getElementById('recent-wins');
    if (!container) return;

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        container.innerHTML = '<p style="opacity: 0.8; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Connexion...</p>';
        return;
    }

    try {
        const { data: wins, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('lead_status', 'won')
            .not('final_sale_price', 'is', null)
            .order('closed_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        if (!wins || wins.length === 0) {
            container.innerHTML = '<p style="opacity: 0.8; text-align: center;">Aucune vente récente</p>';
            return;
        }

        container.innerHTML = wins.map((win, index) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; ${index < wins.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.2);' : ''}">
                <div>
                    <strong style="font-size: 0.9rem;">${escapeHtml(win.client_name)}</strong>
                    <br><small style="opacity: 0.8;">${formatDate(win.closed_at)}</small>
                </div>
                <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600;">
                    TND ${formatNumber(win.final_sale_price)}
                </span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent wins:', error);
        container.innerHTML = '<p style="opacity: 0.8; text-align: center;">Erreur</p>';
    }
}

// ==================== DIAGNOSTIC FUNCTION ====================

async function testSupabaseConnection() {
    console.group('🔍 Supabase Connection Test');

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.log('❌ Supabase client is NOT initialized');
        console.groupEnd();
        return;
    }

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

    // Pipeline/Lead Management functions
    window.loadPipeline = loadPipeline;
    window.viewLead = viewLead;
    window.viewMessage = viewMessage;
    window.closeLeadModal = closeLeadModal;
    window.changeLeadStatus = changeLeadStatus;
    window.openWinWizard = openWinWizard;
    window.closeWinWizard = closeWinWizard;
    window.openWhatsApp = openWhatsApp;

    // Sales Ledger functions
    window.loadSalesLedger = loadSalesLedger;
    window.exportSalesLedgerToCSV = exportSalesLedgerToCSV;
    window.exportPipelineToCSV = exportPipelineToCSV;

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
    } catch (_) { }
});

// ==================== STORAGE INITIALIZATION ====================

async function initializeStorageBucket() {
    if (!supabaseClient) {
        console.warn('⚠️ Supabase client not ready for storage init');
        return false;
    }

    try {
        // List existing buckets
        const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();

        if (listError) {
            console.warn('⚠️ Could not list buckets:', listError.message);
            return false;
        }

        // Check if textile-images bucket exists
        const bucketExists = buckets?.some(b => b.name === 'textile-images');

        if (bucketExists) {
            console.log('✅ Storage bucket "textile-images" already exists');
            return true;
        }

        // Try to create the bucket
        console.log('📦 Creating storage bucket "textile-images"...');
        const { data: newBucket, error: createError } = await supabaseClient.storage.createBucket('textile-images', {
            public: true,
            fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
            console.warn('⚠️ Could not create bucket:', createError.message);
            console.warn('Please create bucket manually: Storage → Create Bucket → "textile-images"');
            return false;
        }

        console.log('✅ Storage bucket created successfully:', newBucket);
        showToast('Bucket de stockage créé avec succès', 'success');
        return true;

    } catch (error) {
        console.error('❌ Storage initialization error:', error);
        return false;
    }
}

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
    document.getElementById('win-wizard-form')?.addEventListener('submit', handleWinWizardSubmit);

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

// ==================== SALES LEDGER ====================

async function loadSalesLedger() {
    const container = document.getElementById('sales-ledger-container');
    if (!container) return;

    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Chargement...</div>';

    // CRITICAL: Check if supabaseClient is ready
    if (!supabaseClient) {
        console.warn('loadSalesLedger: Supabase not ready yet');
        container.innerHTML = '<p class="loading" style="color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Connexion en cours...</p>';
        showToast('Connexion en cours...', 'warning');
        return;
    }

    try {
        const period = document.getElementById('ledger-period')?.value || 'all';

        let query = supabaseClient
            .from('orders')
            .select('*')
            .eq('lead_status', 'won')
            .not('final_sale_price', 'is', null)
            .order('closed_at', { ascending: false });

        // Apply period filter
        if (period === 'this-month') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            query = query.gte('closed_at', startOfMonth.toISOString());
        } else if (period === 'last-month') {
            const startOfLastMonth = new Date();
            startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
            startOfLastMonth.setDate(1);
            startOfLastMonth.setHours(0, 0, 0, 0);
            const endOfLastMonth = new Date();
            endOfLastMonth.setDate(0);
            endOfLastMonth.setHours(23, 59, 59, 999);
            query = query.gte('closed_at', startOfLastMonth.toISOString()).lte('closed_at', endOfLastMonth.toISOString());
        } else if (period === 'this-year') {
            const startOfYear = new Date();
            startOfYear.setMonth(0, 1);
            startOfYear.setHours(0, 0, 0, 0);
            query = query.gte('closed_at', startOfYear.toISOString());
        }

        const { data: sales, error } = await query;

        if (error) throw error;

        // Calculate analytics
        const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.final_sale_price || 0), 0);
        const totalDeals = sales.length;
        const avgDeal = totalDeals > 0 ? totalRevenue / totalDeals : 0;

        // Get total leads for conversion rate
        const { count: totalLeads } = await supabaseClient
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const conversionRate = totalLeads > 0 ? (totalDeals / totalLeads * 100).toFixed(1) : 0;

        // Update analytics cards
        const updateEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        updateEl('ledger-total-revenue', `TND ${formatNumber(totalRevenue)}`);
        updateEl('ledger-total-deals', totalDeals);
        updateEl('ledger-avg-deal', `TND ${formatNumber(avgDeal)}`);
        updateEl('ledger-conversion', `${conversionRate}%`);
        updateEl('sales-count-badge', `${totalDeals} ventes`);

        if (sales.length === 0) {
            container.innerHTML = '<p class="loading">Aucune vente enregistrée.</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table sales-ledger-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Produit</th>
                        <th>Montant</th>
                        <th>Vendeur</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map(sale => `
                        <tr>
                            <td>${formatDate(sale.closed_at)}</td>
                            <td>
                                <strong>${escapeHtml(sale.client_name)}</strong>
                                ${sale.client_company ? `<br><small style="color: #64748b;">${escapeHtml(sale.client_company)}</small>` : ''}
                            </td>
                            <td>${escapeHtml(sale.product_interest || '-')}</td>
                            <td class="sale-amount-cell">TND ${formatNumber(sale.final_sale_price)}</td>
                            <td>${escapeHtml(sale.salesperson || '-')}</td>
                            <td><small style="color: #64748b;">${escapeHtml(sale.sale_notes || '-')}</small></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Error loading sales ledger:', error);
        container.innerHTML = '<p class="loading" style="color: #dc2626;">Erreur de chargement</p>';
    }
}

// ==================== STORAGE MANAGEMENT ====================

// Utility function to format bytes to human-readable size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Load storage statistics and files
async function loadStorageStats() {
    console.log('📦 Loading storage statistics...');

    // Check if Supabase is ready
    if (!supabaseClient) {
        console.warn('loadStorageStats: Supabase not ready yet');
        showToast('Connexion en cours...', 'warning');
        return;
    }

    try {
        // List all files in the bucket
        const { data: files, error } = await supabaseClient.storage
            .from('textile-images')
            .list('', {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) throw error;

        // Also list files in products folder
        const { data: productFiles, error: productError } = await supabaseClient.storage
            .from('textile-images')
            .list('products', {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (productError) throw productError;

        // Combine all files
        const allFiles = [
            ...files.map(f => ({ ...f, path: f.name })),
            ...productFiles.map(f => ({ ...f, path: `products/${f.name}` }))
        ];

        // Filter out folders (they have metadata.size undefined or null)
        const actualFiles = allFiles.filter(f => f.metadata && f.metadata.size);

        // Calculate total size
        const totalBytes = actualFiles.reduce((sum, file) => sum + (file.metadata.size || 0), 0);
        const totalMB = totalBytes / (1024 * 1024);
        const limitMB = 50;
        const availableMB = limitMB - totalMB;
        const percentage = (totalMB / limitMB) * 100;

        // Update statistics
        document.getElementById('storage-used').textContent = totalMB.toFixed(2) + ' MB';
        document.getElementById('storage-available').textContent = Math.max(0, availableMB).toFixed(2) + ' MB';
        document.getElementById('storage-percentage').textContent = percentage.toFixed(1) + '%';
        document.getElementById('storage-file-count').textContent = actualFiles.length;

        // Update progress bar
        const progressBar = document.getElementById('storage-progress-bar');
        const progressText = document.getElementById('storage-progress-text');

        progressBar.style.width = Math.min(100, percentage).toFixed(1) + '%';
        progressText.textContent = `${totalMB.toFixed(2)} MB / ${limitMB} MB`;

        // Change color based on usage
        if (percentage > 80) {
            progressBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
        } else if (percentage > 50) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
        }

        // Load files table
        loadStorageFiles(actualFiles);

        console.log(`✅ Storage stats loaded: ${totalMB.toFixed(2)} MB used (${percentage.toFixed(1)}%)`);

    } catch (error) {
        console.error('❌ Error loading storage stats:', error);
        showToast('Erreur lors du chargement du stockage: ' + error.message, 'error');
    }
}

// Load and display files in table
function loadStorageFiles(files) {
    const container = document.getElementById('storage-files-container');
    const badge = document.getElementById('storage-files-badge');

    badge.textContent = `${files.length} fichiers`;

    if (files.length === 0) {
        container.innerHTML = '<p class="loading">Aucun fichier dans le stockage.</p>';
        return;
    }

    // Sort by size (largest first)
    files.sort((a, b) => (b.metadata.size || 0) - (a.metadata.size || 0));

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th style="width: 80px;">Aperçu</th>
                    <th>Nom du Fichier</th>
                    <th>Chemin</th>
                    <th style="width: 120px;">Taille</th>
                    <th style="width: 180px;">Date</th>
                    <th style="width: 100px;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => {
        const publicUrl = supabaseClient.storage
            .from('textile-images')
            .getPublicUrl(file.path).data.publicUrl;

        return `
                        <tr>
                            <td>
                                <img src="${escapeHtml(publicUrl)}" 
                                     alt="Preview" 
                                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; display: block;"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div style="display: none; width: 60px; height: 60px; background: #f1f5f9; border-radius: 8px; align-items: center; justify-content: center;">
                                    <i class="fas fa-file" style="color: #94a3b8;"></i>
                                </div>
                            </td>
                            <td><strong>${escapeHtml(file.name)}</strong></td>
                            <td><code style="font-size: 0.85rem; color: #64748b;">${escapeHtml(file.path)}</code></td>
                            <td><span class="badge badge-info">${formatFileSize(file.metadata.size)}</span></td>
                            <td style="color: #64748b; font-size: 0.9rem;">${formatDate(file.created_at)}</td>
                            <td class="actions">
                                <button class="btn-icon delete" 
                                        data-action="delete-storage-file" 
                                        data-path="${escapeHtml(file.path)}" 
                                        title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// Global variable to store file path for deletion
let deleteStorageFilePath = null;

// Confirm delete storage file
function confirmDeleteStorageFile(path) {
    deleteStorageFilePath = path;
    deleteType = 'storage-file';

    // Show confirmation
    if (confirm(`⚠️ Êtes-vous sûr de vouloir supprimer ce fichier?\n\nChemin: ${path}\n\nAttention: Cette action est irréversible et peut casser les produits/actualités qui utilisent cette image!`)) {
        deleteStorageFile(path);
    }
}

// Delete storage file
async function deleteStorageFile(path) {
    console.log('🗑️ Deleting storage file:', path);

    if (!supabaseClient) {
        showToast('Connexion non disponible', 'error');
        return;
    }

    try {
        const { data, error } = await supabaseClient.storage
            .from('textile-images')
            .remove([path]);

        if (error) throw error;

        console.log('✅ File deleted:', path);
        showToast('Fichier supprimé avec succès');

        // Reload storage stats
        await loadStorageStats();

    } catch (error) {
        console.error('❌ Delete error:', error);
        showToast('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

// ==================== GLOBAL EVENT SYSTEM ====================


document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Admin panel initializing...');

    // CRITICAL: Wait for Supabase to be ready before doing anything
    console.log('⏳ Waiting for Supabase...');
    if (window.supabaseReady) {
        await window.supabaseReady;
    } else {
        // Fallback: wait up to 5 seconds for supabaseClient to be available
        let attempts = 0;
        while (!supabaseClient && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
    }

    if (!supabaseClient) {
        console.error('❌ Supabase client failed to initialize');
        showToast('Erreur de connexion au serveur. Veuillez rafraîchir la page.', 'error');
        // Still try to show something
    } else {
        console.log('✅ Supabase client ready');
    }

    // ==================== GLOBAL EXPORTS ====================
    function exportToWindow() {
        window.openNewsModal = openNewsModal;
        window.closeNewsModal = closeNewsModal;
        window.openJobModal = openJobModal;
        window.closeJobModal = closeJobModal;
        window.openProductModal = openProductModal;
        window.closeProductModal = closeProductModal;
        window.openShowroomModal = openShowroomModal;
        window.closeShowroomModal = closeShowroomModal;
        window.closeMessageModal = closeMessageModal;
        window.closeConfirmModal = typeof closeConfirmModal !== 'undefined' ? closeConfirmModal : () => document.getElementById('confirm-modal')?.classList.remove('active');

        // Pipeline functions
        window.loadPipeline = loadPipeline;
        window.switchSection = switchSection;
        window.showToast = showToast;
        window.exportSalesLedgerToCSV = loadSalesLedger ? exportSalesLedgerToCSV : null;
        window.exportPipelineToCSV = window.exportPipelineToCSV || null;

        // Make handlers available
        window.handleNewsFormSubmit = handleNewsFormSubmit;
        window.handleJobFormSubmit = handleJobFormSubmit;
        window.handleProductFormSubmit = handleProductFormSubmit;
        window.handleShowroomFormSubmit = handleShowroomFormSubmit;
        window.handleWinWizardSubmit = typeof handleWinWizardSubmit !== 'undefined' ? handleWinWizardSubmit : null;
        window.handleConfirmDelete = typeof handleConfirmDelete !== 'undefined' ? handleConfirmDelete : null;

        console.log('✅ Admin functions exported to window scope');
    }

    // Export immediately
    try {
        exportToWindow();
        console.log('✅ Functions exported');
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

    // Initialize storage bucket (for image uploads)
    console.log('📦 Initializing storage...');
    await initializeStorageBucket();

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

function renderKanbanColumnV2(status, leads) {
    const container = document.getElementById(`cards-${status}`);
    if (!container) return;

    if (leads.length === 0) {
        container.innerHTML = `
            <div class="kanban-empty" style="padding: 2rem; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 12px; background: #f8fafc; transition: all 0.3s;">
                <div style="width: 48px; height: 48px; margin: 0 auto 1rem; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-inbox" style="font-size: 1.25rem; color: #cbd5e1;"></i>
                </div>
                <p style="margin: 0; font-weight: 500; color: #64748b;">Aucun lead</p>
                <small style="display: block; margin-top: 4px; opacity: 0.7; font-size: 0.8rem;">Cette colonne est vide</small>
            </div>
        `;
        return;
    }

    container.innerHTML = leads.map(lead => {
        const tags = lead.lead_tags || [];
        const isVip = tags.includes('vip') || tags.includes('high_potential');
        const isWholesale = tags.includes('wholesale');

        // Generate avatar color
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
        const nameHash = (lead.client_name || 'U').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const avatarColor = colors[nameHash % colors.length];
        const initials = (lead.client_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        return `
            <div class="lead-card modern-card" 
                 data-id="${lead.id}" 
                 draggable="true"
                 style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02); transition: all 0.2s ease; position: relative; overflow: hidden; cursor: pointer;">
                
                ${isVip ? '<div style="position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 40px 40px 0; border-color: transparent #f59e0b transparent transparent; z-index: 1;"><i class="fas fa-star" style="position: absolute; top: 6px; right: -36px; color: white; font-size: 0.7rem;"></i></div>' : ''}
                
                <div class="card-header" style="display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 1rem;">
                    <div class="user-avatar" style="width: 42px; height: 42px; background: ${avatarColor}; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ${initials}
                    </div>
                    <div class="card-meta" style="min-width: 0; flex: 1;">
                        <h4 class="card-title" style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${escapeHtml(lead.client_name)}</h4>
                        <span class="card-subtitle" style="display: block; font-size: 0.8rem; color: #64748b;">
                            ${escapeHtml(lead.client_company || 'Particulier')}
                        </span>
                    </div>
                </div>

                <div class="card-body">
                    ${(isVip || isWholesale) ? `
                        <div class="tags" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                            ${isVip ? '<span style="background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; border-radius: 20px; padding: 2px 8px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px;">VIP</span>' : ''}
                            ${isWholesale ? '<span style="background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; border-radius: 20px; padding: 2px 8px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px;">B2B</span>' : ''}
                        </div>
                    ` : ''}

                    <div class="product-interest" style="margin-bottom: 1rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <i class="fas fa-box" style="color: #64748b; font-size: 0.9rem;"></i>
                            <span style="font-weight: 600; color: #334155; font-size: 0.9rem;">${escapeHtml(lead.product_interest || 'Non spécifié')}</span>
                        </div>
                        ${lead.quantity ? `<div style="font-size: 0.8rem; color: #64748b; margin-left: 24px;">Quantité: <strong style="color: #334155;">${lead.quantity}</strong></div>` : ''}
                    </div>

                    ${status === 'won' && lead.final_sale_price ? `
                        <div style="margin-bottom: 1rem; text-align: right; background: #ecfdf5; padding: 0.5rem 1rem; border-radius: 6px;">
                            <span style="color: #059669; font-weight: 700; font-size: 0.95rem;">+ TND ${formatNumber(lead.final_sale_price)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Expanded Details (Hidden by default) -->
                <div class="lead-card-details" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; animation: fadeIn 0.3s ease;">
                    <div style="font-size: 0.9rem; color: #475569; white-space: pre-wrap; margin-bottom: 1.5rem; line-height: 1.6; font-style: italic; background: #fff; padding: 0.5rem; border-radius: 6px;">
                        "${escapeHtml(lead.message || 'Aucun message joint.')}"
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 0.75rem;">
                            ${lead.client_email ? `<a href="mailto:${lead.client_email}" title="Envoyer un email" style="color: #64748b; font-size: 1.1rem; transition: color 0.2s;" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#64748b'"><i class="fas fa-envelope"></i></a>` : ''}
                            ${lead.metadata?.cv_url ? `<a href="${lead.metadata.cv_url}" target="_blank" title="Voir le CV" style="color: #64748b; font-size: 1.1rem; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'"><i class="fas fa-file-pdf"></i></a>` : ''}
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewLead('${lead.id}')" style="font-size: 0.85rem; padding: 0.4rem 1rem; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
                            <i class="fas fa-sliders-h"></i> Gérer
                        </button>
                    </div>
                </div>

                <div class="card-footer" style="margin-top: 0; padding-top: 1rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">
                        <i class="far fa-clock" style="margin-right: 4px;"></i>${formatDate(lead.created_at)}
                    </span>
                    <div class="actions" style="display: flex; gap: 0.5rem;">
                        ${lead.client_phone ? `
                            <button onclick="event.stopPropagation(); openWhatsApp('${lead.client_phone}')" 
                                    style="width: 32px; height: 32px; border-radius: 50%; border: none; background: #dcfce7; color: #16a34a; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                                    title="WhatsApp">
                                <i class="fab fa-whatsapp" style="font-size: 1rem;"></i>
                            </button>
                        ` : ''}
                        <button onclick="event.stopPropagation(); toggleLeadCard(this, '${lead.id}')" 
                                style="width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                                onmouseover="this.style.background='#e2e8f0'"
                                onmouseout="this.style.background='#f1f5f9'"
                                title="Voir détails">
                            <i class="fas fa-chevron-down" style="font-size: 0.9rem;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.lead-card').forEach(card => {
        card.addEventListener('click', () => {
            viewLead(card.dataset.id);
        });
    });
}

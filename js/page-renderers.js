/**
 * Page Renderers
 * Functions to render dynamic content on each page
 */

const PageRenderers = {

    // ==================== PRODUCTS PAGE ====================

    // Products pagination state
    productsCurrentPage: 1,
    productsPerPage: 9,
    productsCategory: null,
    productsSearchTerm: null,

    async renderProducts(containerId = 'products-grid', category = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

        try {
            const products = await DataService.getProducts(category);

            if (products.length === 0) {
                container.innerHTML = '<p class="no-results">Aucun produit trouvé.</p>';
                return;
            }

            container.innerHTML = products.map(product => `
                <div class="product-card" data-category="${product.category}">
                    <div class="product-image">
                        <div style="width: 100%; height: 100%; background: ${product.gradient}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${product.icon}" style="font-size: 4rem; color: white;"></i>
                        </div>
                        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    </div>
                    <div class="product-content">
                        <span class="product-category">${this.capitalizeFirst(product.category)}</span>
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <div class="product-actions">
                            <a href="quote.html" class="btn btn-primary">Demander un devis</a>
                            <a href="quote.html" class="btn btn-secondary">Commander</a>
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-initialize product filters if they exist
            this.initProductFilters();
        } catch (error) {
            console.error('Error rendering products:', error);
            container.innerHTML = '<p class="error">Erreur lors du chargement des produits.</p>';
        }
    },

    async renderProductsPaginated(containerId = 'products-grid', paginationId = 'products-pagination') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

        try {
            const result = await DataService.getProductsPaginated(
                this.productsCurrentPage,
                this.productsPerPage,
                this.productsCategory,
                this.productsSearchTerm
            );

            if (result.data.length === 0) {
                container.innerHTML = '<p class="no-results" style="text-align: center; padding: 2rem; color: #64748b;">Aucun produit trouvé.</p>';
                this.renderPagination(paginationId, result, 'products');
                return;
            }

            container.innerHTML = result.data.map(product => `
                <div class="product-card" data-category="${product.category}">
                    <div class="product-image">
                        <div style="width: 100%; height: 100%; background: ${product.gradient}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${product.icon}" style="font-size: 4rem; color: white;"></i>
                        </div>
                        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    </div>
                    <div class="product-content">
                        <span class="product-category">${this.capitalizeFirst(product.category)}</span>
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <div class="product-actions">
                            <a href="quote.html" class="btn btn-primary">Demander un devis</a>
                            <a href="quote.html" class="btn btn-secondary">Commander</a>
                        </div>
                    </div>
                </div>
            `).join('');

            this.renderPagination(paginationId, result, 'products');
            this.initProductFilters();
        } catch (error) {
            console.error('Error rendering products:', error);
            container.innerHTML = '<p class="error">Erreur lors du chargement des produits.</p>';
        }
    },

    searchProducts(searchTerm) {
        this.productsSearchTerm = searchTerm || null;
        this.productsCurrentPage = 1;
        this.renderProductsPaginated();
    },

    filterProductsByCategory(category) {
        this.productsCategory = category === 'all' ? null : category;
        this.productsCurrentPage = 1;
        this.renderProductsPaginated();
    },

    goToProductsPage(page) {
        this.productsCurrentPage = page;
        this.renderProductsPaginated();
    },

    async renderFeaturedProducts(containerId = 'featured-products') {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const products = await DataService.getFeaturedProducts(3);

            container.innerHTML = products.map(product => `
                <div class="product-card" data-category="${product.category}">
                    <div class="product-image">
                        <div style="width: 100%; height: 100%; background: ${product.gradient}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${product.icon}" style="font-size: 4rem; color: white;"></i>
                        </div>
                        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    </div>
                    <div class="product-content">
                        <span class="product-category">${this.capitalizeFirst(product.category)}</span>
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <div class="product-actions">
                            <a href="quote.html" class="btn btn-primary">Devis</a>
                            <a href="products.html" class="btn btn-secondary">Détails</a>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering featured products:', error);
        }
    },

    initProductFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const productCards = document.querySelectorAll('.product-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;

                productCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    },

    // ==================== NEWS PAGE ====================

    // News pagination state
    newsCurrentPage: 1,
    newsPerPage: 6,
    newsSearchTerm: null,

    async renderNews(containerId = 'news-grid', paginationId = 'news-pagination') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

        try {
            const result = await DataService.getNewsPaginated(
                this.newsCurrentPage, 
                this.newsPerPage, 
                this.newsSearchTerm
            );

            if (result.data.length === 0) {
                container.innerHTML = '<p class="no-results" style="text-align: center; padding: 2rem; color: #64748b;">Aucune actualité trouvée.</p>';
                this.renderPagination(paginationId, result, 'news');
                return;
            }

            container.innerHTML = result.data.map(article => `
                <article class="news-card" style="display: flex; flex-direction: row; gap: 2rem;">
                    <div class="news-image" style="width: 300px; min-width: 300px; height: 200px;">
                        <div style="width: 100%; height: 100%; background: ${article.gradient}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${article.icon}" style="font-size: 3rem; color: white;"></i>
                        </div>
                    </div>
                    <div class="news-content" style="padding: 0;">
                        <div class="news-meta">
                            <span><i class="far fa-calendar"></i> ${this.formatDate(article.published_at)}</span>
                            <span><i class="far fa-folder"></i> ${article.category}</span>
                            <span><i class="far fa-user"></i> ${article.author}</span>
                        </div>
                        <h3><a href="#">${article.title}</a></h3>
                        <p>${article.excerpt || article.content?.substring(0, 200) + '...'}</p>
                        <a href="#" class="news-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `).join('');

            this.renderPagination(paginationId, result, 'news');
        } catch (error) {
            console.error('Error rendering news:', error);
            container.innerHTML = '<p class="error">Erreur lors du chargement des actualités.</p>';
        }
    },

    searchNews(searchTerm) {
        this.newsSearchTerm = searchTerm || null;
        this.newsCurrentPage = 1;
        this.renderNews();
    },

    goToNewsPage(page) {
        this.newsCurrentPage = page;
        this.renderNews();
    },

    async renderFeaturedNews(containerId = 'featured-news') {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const news = await DataService.getFeaturedNews(3);

            container.innerHTML = news.map(article => `
                <article class="news-card">
                    <div class="news-image">
                        <div style="width: 100%; height: 100%; background: ${article.gradient}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${article.icon}" style="font-size: 3rem; color: white;"></i>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span><i class="far fa-calendar"></i> ${this.formatDate(article.published_at)}</span>
                            <span><i class="far fa-folder"></i> ${article.category}</span>
                        </div>
                        <h3><a href="news.html">${article.title}</a></h3>
                        <p>${article.excerpt || article.content?.substring(0, 150) + '...'}</p>
                        <a href="news.html" class="news-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `).join('');
        } catch (error) {
            console.error('Error rendering featured news:', error);
        }
    },

    // ==================== JOBS PAGE ====================

    async renderJobs(containerId = 'jobs-grid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

        try {
            const jobs = await DataService.getJobs();

            if (jobs.length === 0) {
                container.innerHTML = '<p class="no-results">Aucune offre d\'emploi disponible actuellement.</p>';
                return;
            }

            container.innerHTML = jobs.map(job => `
                <div class="job-card">
                    <div class="job-info">
                        <h3>${job.title}</h3>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-clock"></i> ${job.contract_type}</span>
                            <span><i class="fas fa-briefcase"></i> ${job.experience}</span>
                        </div>
                        <p>${job.description}</p>
                    </div>
                    <a href="#application-form" class="btn btn-primary">Postuler</a>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering jobs:', error);
            container.innerHTML = '<p class="error">Erreur lors du chargement des offres.</p>';
        }
    },

    // ==================== SHOWROOM PAGE ====================

    async renderShowroom(containerId = 'showroom-grid', category = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';

        try {
            const items = await DataService.getShowroomItems(category);

            container.innerHTML = items.map(item => `
                <div class="showroom-item" data-category="${item.category}">
                    <div style="width: 100%; height: 100%; background: ${item.gradient}; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${item.icon}" style="font-size: 5rem; color: white;"></i>
                    </div>
                    <div class="showroom-overlay">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                </div>
            `).join('');

            // Re-initialize showroom filters if they exist
            this.initShowroomFilters();
        } catch (error) {
            console.error('Error rendering showroom:', error);
            container.innerHTML = '<p class="error">Erreur lors du chargement de la galerie.</p>';
        }
    },

    initShowroomFilters() {
        const filterBtns = document.querySelectorAll('.products-filter .filter-btn');
        const showroomItems = document.querySelectorAll('.showroom-item');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;

                showroomItems.forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    },

    // ==================== STATS (About Page) ====================

    async renderAboutStats(containerId = 'about-stats') {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const stats = await DataService.getStats('about');

            container.innerHTML = stats.map(stat => `
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas ${stat.icon}"></i>
                    </div>
                    <h3 style="font-size: 2.5rem; color: var(--primary-color);">${stat.value}</h3>
                    <p style="font-size: 1.1rem; font-weight: 500;">${stat.label}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering about stats:', error);
        }
    },

    // ==================== FOOTER (All Pages) ====================

    async renderFooterContact() {
        try {
            const config = await DataService.getSiteConfig();

            // Update footer contact info
            const footerContact = document.querySelector('.footer-contact');
            if (footerContact && config) {
                const addressParts = config.address.split(',');
                footerContact.innerHTML = `
                    <li>
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${addressParts[0]}<br>${addressParts.slice(1).join(',').trim()}</span>
                    </li>
                    <li>
                        <i class="fas fa-phone"></i>
                        <span>${config.phone}</span>
                    </li>
                    <li>
                        <i class="fas fa-envelope"></i>
                        <span>${config.email}</span>
                    </li>
                    <li>
                        <i class="fas fa-clock"></i>
                        <span>${config.business_hours}</span>
                    </li>
                `;
            }

            // Update social links
            const socialLinks = document.querySelectorAll('.footer-social a');
            if (socialLinks.length > 0 && config.social_links) {
                const platforms = ['facebook', 'instagram', 'linkedin', 'twitter'];
                socialLinks.forEach((link, index) => {
                    if (platforms[index] && config.social_links[platforms[index]]) {
                        link.href = config.social_links[platforms[index]];
                    }
                });
            }
        } catch (error) {
            console.error('Error rendering footer:', error);
        }
    },

    // ==================== UTILITIES ====================

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    // ==================== PAGINATION ====================

    renderPagination(containerId, result, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { currentPage, totalPages, count } = result;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem;">';

        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="PageRenderers.goTo${this.capitalizeFirst(type)}Page(${currentPage - 1})"
                    style="padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'}; opacity: ${currentPage === 1 ? '0.5' : '1'};">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="PageRenderers.goTo${this.capitalizeFirst(type)}Page(1)"
                        style="padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer;">
                    1
                </button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span style="padding: 0.5rem;">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            paginationHTML += `
                <button class="pagination-btn ${isActive ? 'active' : ''}" 
                        onclick="PageRenderers.goTo${this.capitalizeFirst(type)}Page(${i})"
                        style="padding: 0.5rem 1rem; border: 1px solid ${isActive ? 'var(--primary-color)' : '#e2e8f0'}; border-radius: 8px; background: ${isActive ? 'var(--primary-color)' : 'white'}; color: ${isActive ? 'white' : 'inherit'}; cursor: pointer;">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span style="padding: 0.5rem;">...</span>';
            }
            paginationHTML += `
                <button class="pagination-btn" onclick="PageRenderers.goTo${this.capitalizeFirst(type)}Page(${totalPages})"
                        style="padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer;">
                    ${totalPages}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="PageRenderers.goTo${this.capitalizeFirst(type)}Page(${currentPage + 1})"
                    style="padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'}; opacity: ${currentPage === totalPages ? '0.5' : '1'};">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHTML += '</div>';
        paginationHTML += `<p style="text-align: center; color: #64748b; margin-top: 1rem; font-size: 0.9rem;">${count} résultat(s) - Page ${currentPage} sur ${totalPages}</p>`;

        container.innerHTML = paginationHTML;
    }
};

// Export for use
window.PageRenderers = PageRenderers;

console.log('✅ Page Renderers initialized');

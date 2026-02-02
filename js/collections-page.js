/**
 * Collections Page - Faceted Filtering Logic
 * Handles categories, filters, search, and product display
 */

const CollectionsPage = {
    // State
    filters: {
        categoryIds: [],
        categorySlugs: [],  // For URL-based slug filtering
        gender: null,
        brands: [],
        colors: [],
        priceMin: null,
        priceMax: null,
        isNew: null,
        isOnSale: null,
        searchTerm: null,
        sortBy: 'newest',
        page: 1,
        perPage: 12
    },
    
    facets: {},
    categories: [],
    currentView: 'grid',
    isLoading: false,
    
    // Initialize
    async init() {
        
        // Parse URL parameters
        this.parseUrlParams();
        
        // Initialize UI first so page is interactive
        this.initEventListeners();
        this.initMobileMenu();
        
        // Load data - handle errors gracefully
        try {
            await Promise.all([
                this.loadCategories().catch(e => {
                    console.error('Failed to load categories:', e);
                    this.renderCategoriesFallback();
                }),
                this.loadProducts().catch(e => {
                    console.error('Failed to load products:', e);
                    this.showError();
                })
            ]);
        } catch (error) {
            console.error('Error during initialization:', error);
        }
        
    },
    
    // Parse URL parameters to restore filters
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        // Handle 'cat' param - can be IDs (1,2,3) or slugs (homme, t-shirts)
        if (params.has('cat')) {
            const catParam = params.get('cat');
            const values = catParam.split(',');
            
            // Check if they're numbers (IDs) or strings (slugs)
            const asNumbers = values.map(Number).filter(n => !isNaN(n) && n > 0);
            if (asNumbers.length === values.length) {
                // All are valid numbers - use as category IDs
                this.filters.categoryIds = asNumbers;
            } else {
                // They're slugs - store them and we'll map to IDs or use as gender
                this.filters.categorySlugs = values;
                // If it's a known gender slug, set gender filter directly
                const genderSlugs = ['homme', 'femme', 'mixte', 'enfant'];
                const genderSlug = values.find(v => genderSlugs.includes(v.toLowerCase()));
                if (genderSlug) {
                    this.filters.gender = genderSlug.toLowerCase();
                }
            }
        }
        if (params.has('gender')) {
            this.filters.gender = params.get('gender');
        }
        if (params.has('brands')) {
            this.filters.brands = params.get('brands').split(',');
        }
        if (params.has('colors')) {
            this.filters.colors = params.get('colors').split(',');
        }
        if (params.has('min')) {
            this.filters.priceMin = parseFloat(params.get('min'));
        }
        if (params.has('max')) {
            this.filters.priceMax = parseFloat(params.get('max'));
        }
        if (params.has('new')) {
            this.filters.isNew = params.get('new') === 'true';
        }
        if (params.has('sale')) {
            this.filters.isOnSale = params.get('sale') === 'true';
        }
        if (params.has('q')) {
            this.filters.searchTerm = params.get('q');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = this.filters.searchTerm;
        }
        if (params.has('sort')) {
            this.filters.sortBy = params.get('sort');
            const sortSelect = document.getElementById('sortSelect');
            if (sortSelect) sortSelect.value = this.filters.sortBy;
        }
        if (params.has('page')) {
            this.filters.page = parseInt(params.get('page')) || 1;
        }
    },
    
    // Update URL with current filters
    updateUrl() {
        const params = new URLSearchParams();
        
        if (this.filters.categoryIds.length > 0) {
            params.set('cat', this.filters.categoryIds.join(','));
        }
        if (this.filters.gender) {
            params.set('gender', this.filters.gender);
        }
        if (this.filters.brands.length > 0) {
            params.set('brands', this.filters.brands.join(','));
        }
        if (this.filters.colors.length > 0) {
            params.set('colors', this.filters.colors.join(','));
        }
        if (this.filters.priceMin !== null) {
            params.set('min', this.filters.priceMin);
        }
        if (this.filters.priceMax !== null) {
            params.set('max', this.filters.priceMax);
        }
        if (this.filters.isNew) {
            params.set('new', 'true');
        }
        if (this.filters.isOnSale) {
            params.set('sale', 'true');
        }
        if (this.filters.searchTerm) {
            params.set('q', this.filters.searchTerm);
        }
        if (this.filters.sortBy !== 'newest') {
            params.set('sort', this.filters.sortBy);
        }
        if (this.filters.page > 1) {
            params.set('page', this.filters.page);
        }
        
        const newUrl = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
            
        window.history.replaceState({}, '', newUrl);
    },
    
    // ==================== LOAD DATA ====================
    
    async loadCategories() {
        try {
            // Try to get categories tree
            if (typeof DataService !== 'undefined' && DataService.getCategoriesTree) {
                this.categories = await DataService.getCategoriesTree();
            } else {
                // Fallback to simple categories
                this.categories = await DataService.getCategories();
            }
            this.renderCategoriesTree();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.renderCategoriesFallback();
        }
    },
    
    async loadProducts() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        this.showLoading();
        
        try {
            let result;
            
            // Prepare the gender filter from URL params
            const genderFilter = this.filters.gender || 
                (this.filters.categorySlugs && this.filters.categorySlugs.length > 0 
                    ? this.filters.categorySlugs[0] 
                    : null);
            
            // Try faceted search first
            if (typeof DataService !== 'undefined' && DataService.getProductsFaceted) {
                try {
                    result = await DataService.getProductsFaceted({
                        ...this.filters,
                        gender: genderFilter
                    });
                } catch (facetError) {
                    console.warn('Faceted search failed, using basic pagination:', facetError);
                    result = null;
                }
            }
            
            // Fallback to basic pagination if faceted search failed or returned nothing
            if (!result || (!result.data || result.data.length === 0)) {
                result = await DataService.getProductsPaginated(
                    this.filters.page,
                    this.filters.perPage,
                    genderFilter,
                    this.filters.searchTerm
                );
            }
            
            // Store facets
            if (result.facets) {
                this.facets = result.facets;
                this.updateFacetCounts();
            }
            
            // Render products
            this.renderProducts(result.data);
            this.renderPagination(result);
            this.updateResultsCount(result.count);
            this.updateActiveFilters();
            this.updateUrl();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError();
        } finally {
            this.isLoading = false;
        }
    },
    
    // ==================== RENDER CATEGORIES ====================
    
    renderCategoriesTree() {
        const container = document.getElementById('categoriesTree');
        if (!container) return;
        
        if (!this.categories || this.categories.length === 0) {
            this.renderCategoriesFallback();
            return;
        }
        
        // Group by parent
        const rootCategories = this.categories.filter(c => !c.parent_id || c.level === 0);
        
        let html = '';
        rootCategories.forEach(cat => {
            const children = this.categories.filter(c => c.parent_id === cat.id || (c.path && c.path[0] === cat.id && c.level === 1));
            const isActive = this.filters.categoryIds.includes(cat.id);
            const count = cat.product_count || this.getCategoryCount(cat.id);
            
            html += `
                <div class="category-item">
                    <div class="category-link ${isActive ? 'active' : ''}" 
                         onclick="CollectionsPage.toggleCategory(${cat.id})"
                         data-category-id="${cat.id}">
                        <span><i class="fas ${cat.icon || 'fa-folder'}"></i> ${this.escapeHtml(cat.name)}</span>
                        <span class="category-count">${count}</span>
                    </div>
                    ${children.length > 0 ? `
                        <div class="category-children">
                            ${children.map(child => `
                                <div class="category-link ${this.filters.categoryIds.includes(child.id) ? 'active' : ''}"
                                     onclick="CollectionsPage.toggleCategory(${child.id})"
                                     data-category-id="${child.id}">
                                    <span>${this.escapeHtml(child.name)}</span>
                                    <span class="category-count">${child.product_count || this.getCategoryCount(child.id)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html || '<p class="text-muted">Aucune catégorie disponible</p>';
    },
    
    renderCategoriesFallback() {
        const container = document.getElementById('categoriesTree');
        if (!container) return;
        
        // Simple fallback with basic categories
        container.innerHTML = `
            <div class="category-link ${!this.filters.gender ? 'active' : ''}" 
                 onclick="CollectionsPage.quickFilter('all')">
                <span><i class="fas fa-th-large"></i> Tous les produits</span>
            </div>
            <div class="category-link ${this.filters.gender === 'homme' ? 'active' : ''}"
                 onclick="CollectionsPage.quickFilter('homme')">
                <span><i class="fas fa-male"></i> Homme</span>
            </div>
            <div class="category-link ${this.filters.gender === 'femme' ? 'active' : ''}"
                 onclick="CollectionsPage.quickFilter('femme')">
                <span><i class="fas fa-female"></i> Femme</span>
            </div>
        `;
    },
    
    getCategoryCount(categoryId) {
        if (this.facets && this.facets.categories) {
            const cat = this.facets.categories.find(c => c.id === categoryId);
            return cat ? cat.count : 0;
        }
        return 0;
    },
    
    // ==================== RENDER PRODUCTS ====================
    
    renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!grid) return;
        
        if (!products || products.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'flex';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        
        grid.innerHTML = products.map(product => this.renderProductCard(product)).join('');
        
        // Initialize hover effects for dual images (same as products page)
        this.initProductImageHoverEffects();
    },
    
    renderProductCard(product) {
        // Check if product is restricted and user doesn't have access
        const isRestricted = product.is_restricted || false;
        const minAccessLevel = product.min_access_level || 0;
        
        // Use ContentRestriction service if available
        const hasAccess = typeof ContentRestriction !== 'undefined' 
            ? ContentRestriction.hasAccess(minAccessLevel)
            : true; // Default to allowing access if service not loaded
        
        const hasImage = product.image_url && product.image_url.trim();
        const hasImage2 = product.image_url_2 && product.image_url_2.trim();
        const gradient = product.gradient || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
        const icon = product.icon || 'fa-tshirt';
        const category = product.gender || product.category || 'Collection';
        
        let badge = '';
        if (product.is_new || product.badge?.toLowerCase() === 'nouveau' || product.badge?.toLowerCase() === 'new') {
            badge = `<span class="pb-badge pb-badge-new">Nouveau</span>`;
        } else if (product.is_on_sale || product.badge?.toLowerCase() === 'promo' || product.badge?.toLowerCase() === 'sale') {
            badge = `<span class="pb-badge pb-badge-sale">Promo</span>`;
        } else if (product.badge) {
            badge = `<span class="pb-badge pb-badge-new">${this.escapeHtml(product.badge)}</span>`;
        }
        
        // Access level badge for restricted content
        const accessLevelLabels = ['', 'Membre', 'Premium', 'Entreprise'];
        const accessBadge = isRestricted && minAccessLevel > 0 
            ? `<span class="pb-badge pb-badge-restricted"><i class="fas fa-lock"></i> ${accessLevelLabels[minAccessLevel]}</span>`
            : '';
        
        // If restricted and no access, render restricted card
        if (isRestricted && !hasAccess) {
            return `
                <div class="pb-product-card pb-product-card-restricted" data-restricted="true" data-access-level="${minAccessLevel}">
                    <div class="pb-product-image">
                        <div class="pb-product-image-inner blurred" 
                             style="background-image: url('${this.escapeHtml(product.image_url || '')}'); background-size: cover; background-position: center; ${!hasImage ? `background: ${gradient};` : ''}"
                             loading="lazy">
                            ${!hasImage ? `<i class="fas ${icon}"></i>` : ''}
                        </div>
                        
                        ${badge}
                        ${accessBadge}
                        
                        <!-- Lock overlay -->
                        <div class="lock-overlay">
                            <div class="lock-icon">
                                <i class="fas fa-lock"></i>
                            </div>
                            <p class="lock-message">Contenu réservé aux ${accessLevelLabels[minAccessLevel]}s</p>
                            <button class="btn-upgrade" onclick="event.stopPropagation(); ContentRestriction.showUpgradeModal(${minAccessLevel})">
                                <i class="fas fa-crown"></i> Débloquer
                            </button>
                        </div>
                    </div>
                    
                    <div class="pb-product-info">
                        <span class="pb-product-category">${this.escapeHtml(this.capitalizeFirst(category))}</span>
                        <h3 class="pb-product-name blurred-text">${this.escapeHtml(product.name)}</h3>
                        <p class="pb-product-desc blurred-text">${this.escapeHtml(product.description || '')}</p>
                        
                        <div class="pb-product-price">
                            <span class="pb-price-current"><i class="fas fa-lock"></i> Réservé</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Normal card (not restricted or has access)
        return `
            <div class="pb-product-card" 
                 data-category="${this.escapeHtml(category)}"
                 data-product-name="${this.escapeHtml(product.name)}"
                 data-product-description="${this.escapeHtml(product.description || '')}"
                 data-product-category="${this.escapeHtml(category)}"
                 data-product-gradient="${gradient}"
                 data-product-icon="${icon}"
                 data-product-image="${this.escapeHtml(product.image_url || '')}"
                 data-product-image2="${this.escapeHtml(product.image_url_2 || '')}"
                 onclick="openProductModalFromCard(this)">
                <div class="pb-product-image">
                    <div class="pb-product-image-inner" 
                         style="background-image: url('${this.escapeHtml(product.image_url || '')}'); background-size: cover; background-position: center; ${!hasImage ? `background: ${gradient};` : ''}"
                         data-image-alt="${this.escapeHtml(product.image_url_2 || '')}"
                         loading="lazy">
                        ${!hasImage ? `<i class="fas ${icon}"></i>` : ''}
                    </div>
                    
                    ${badge}
                    ${accessBadge}
                    
                    <button class="pb-cart-btn" 
                            data-product-id="${product.id}"
                            data-product-name="${this.escapeHtml(product.name)}"
                            data-product-category="${this.escapeHtml(category)}"
                            data-product-image="${this.escapeHtml(product.image_url || '')}"
                            data-product-gradient="${gradient}"
                            data-product-icon="${icon}"
                            data-product-description="${this.escapeHtml(product.description || '')}"
                            onclick="event.stopPropagation(); addToCartFromCard(this)" 
                            aria-label="Ajouter au panier">
                        <i class="fas fa-shopping-cart"></i>
                    </button>

                    <div class="pb-quick-actions">
                        <a href="quote.html" class="pb-quick-btn pb-quick-btn-primary" onclick="event.stopPropagation()">
                            <i class="fas fa-file-invoice"></i>
                            <span>Devis</span>
                        </a>
                    </div>
                </div>
                
                <div class="pb-product-info">
                    <span class="pb-product-category">${this.escapeHtml(this.capitalizeFirst(category))}</span>
                    <h3 class="pb-product-name">${this.escapeHtml(product.name)}</h3>
                    <p class="pb-product-desc">${this.escapeHtml(product.description || '')}</p>
                    
                    <div class="pb-product-price">
                        <span class="pb-price-current">Sur devis</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Initialize hover effects for dual product images
    initProductImageHoverEffects() {
        const productCards = document.querySelectorAll('.pb-product-card');
        productCards.forEach(card => {
            const imageInner = card.querySelector('.pb-product-image-inner');
            if (!imageInner) return;
            
            const primaryImage = imageInner.style.backgroundImage;
            const altImageUrl = imageInner.getAttribute('data-image-alt');
            
            if (altImageUrl && altImageUrl.trim()) {
                card.addEventListener('mouseenter', () => {
                    imageInner.style.backgroundImage = `url('${altImageUrl}')`;
                });
                card.addEventListener('mouseleave', () => {
                    imageInner.style.backgroundImage = primaryImage;
                });
            }
        });
    },
    
    // ==================== RENDER PAGINATION ====================
    
    renderPagination(result) {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        const { totalPages, currentPage } = result;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `
            <button class="pagination-btn" 
                    onclick="CollectionsPage.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="CollectionsPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                        onclick="CollectionsPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="CollectionsPage.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Next button
        html += `
            <button class="pagination-btn" 
                    onclick="CollectionsPage.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        container.innerHTML = html;
    },
    
    goToPage(page) {
        this.filters.page = page;
        this.loadProducts();
        // Scroll to top of products
        document.querySelector('.collections-main')?.scrollIntoView({ behavior: 'smooth' });
    },
    
    // ==================== FILTER HANDLERS ====================
    
    toggleCategory(categoryId) {
        const index = this.filters.categoryIds.indexOf(categoryId);
        if (index > -1) {
            this.filters.categoryIds.splice(index, 1);
        } else {
            this.filters.categoryIds.push(categoryId);
        }
        this.filters.page = 1;
        this.loadProducts();
        this.updateCategoryUI();
    },
    
    updateCategoryUI() {
        document.querySelectorAll('.category-link').forEach(el => {
            const catId = parseInt(el.dataset.categoryId);
            if (this.filters.categoryIds.includes(catId)) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    },
    
    quickFilter(type) {
        // Update quick filter pills
        document.querySelectorAll('.quick-filter-pill').forEach(pill => {
            pill.classList.remove('active');
            if (pill.dataset.filter === type) {
                pill.classList.add('active');
            }
        });
        
        // Apply filter
        switch (type) {
            case 'all':
                this.filters.gender = null;
                this.filters.isNew = null;
                break;
            case 'homme':
            case 'femme':
                this.filters.gender = type;
                this.filters.isNew = null;
                break;
            case 'new':
                this.filters.isNew = true;
                this.filters.gender = null;
                break;
        }
        
        this.filters.page = 1;
        this.loadProducts();
    },
    
    onGenderChange(gender) {
        if (this.filters.gender === gender) {
            this.filters.gender = null;
        } else {
            this.filters.gender = gender;
        }
        this.filters.page = 1;
        this.loadProducts();
    },
    
    onPriceChange() {
        const minInput = document.getElementById('priceMin');
        const maxInput = document.getElementById('priceMax');
        
        this.filters.priceMin = minInput && minInput.value ? parseFloat(minInput.value) : null;
        this.filters.priceMax = maxInput && maxInput.value ? parseFloat(maxInput.value) : null;
        this.filters.page = 1;
        
        // Debounce
        clearTimeout(this.priceDebounce);
        this.priceDebounce = setTimeout(() => {
            this.loadProducts();
        }, 500);
    },
    
    onPriceSliderChange(value) {
        const maxInput = document.getElementById('priceMax');
        if (maxInput) {
            maxInput.value = value;
        }
        this.onPriceChange();
    },
    
    toggleColor(color) {
        const index = this.filters.colors.indexOf(color);
        if (index > -1) {
            this.filters.colors.splice(index, 1);
        } else {
            this.filters.colors.push(color);
        }
        this.filters.page = 1;
        this.loadProducts();
        this.updateColorUI();
    },
    
    updateColorUI() {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            const color = swatch.dataset.color;
            if (this.filters.colors.includes(color)) {
                swatch.classList.add('active');
            } else {
                swatch.classList.remove('active');
            }
        });
    },
    
    toggleBrand(brand) {
        const index = this.filters.brands.indexOf(brand);
        if (index > -1) {
            this.filters.brands.splice(index, 1);
        } else {
            this.filters.brands.push(brand);
        }
        this.filters.page = 1;
        this.loadProducts();
    },
    
    onSpecialFilterChange() {
        const newCheckbox = document.getElementById('filterNew');
        const saleCheckbox = document.getElementById('filterSale');
        
        this.filters.isNew = newCheckbox && newCheckbox.checked ? true : null;
        this.filters.isOnSale = saleCheckbox && saleCheckbox.checked ? true : null;
        this.filters.page = 1;
        this.loadProducts();
    },
    
    onSearchInput(event) {
        const input = event.target;
        const clearBtn = document.getElementById('searchClear');
        
        if (clearBtn) {
            clearBtn.style.display = input.value.trim() ? 'block' : 'none';
        }
        
        if (event.key === 'Enter') {
            this.filters.searchTerm = input.value.trim() || null;
            this.filters.page = 1;
            this.loadProducts();
        }
    },
    
    clearSearch() {
        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('searchClear');
        
        if (input) input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        
        this.filters.searchTerm = null;
        this.filters.page = 1;
        this.loadProducts();
    },
    
    onSortChange() {
        const select = document.getElementById('sortSelect');
        if (select) {
            this.filters.sortBy = select.value;
            this.filters.page = 1;
            this.loadProducts();
        }
    },
    
    setView(view) {
        this.currentView = view;
        const grid = document.getElementById('productsGrid');
        
        if (grid) {
            grid.dataset.view = view;
        }
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    },
    
    // ==================== CLEAR FILTERS ====================
    
    clearAllFilters() {
        this.filters = {
            categoryIds: [],
            gender: null,
            brands: [],
            colors: [],
            priceMin: null,
            priceMax: null,
            isNew: null,
            isOnSale: null,
            searchTerm: null,
            sortBy: 'newest',
            page: 1,
            perPage: 12
        };
        
        // Reset UI
        document.querySelectorAll('.quick-filter-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.filter === 'all');
        });
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = 'newest';
        
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        if (priceMin) priceMin.value = '';
        if (priceMax) priceMax.value = '';
        
        document.querySelectorAll('.filter-checkbox input').forEach(cb => cb.checked = false);
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.category-link').forEach(c => c.classList.remove('active'));
        
        this.loadProducts();
    },
    
    removeFilter(type, value) {
        switch (type) {
            case 'category':
                this.filters.categoryIds = this.filters.categoryIds.filter(id => id !== value);
                break;
            case 'gender':
                this.filters.gender = null;
                break;
            case 'brand':
                this.filters.brands = this.filters.brands.filter(b => b !== value);
                break;
            case 'color':
                this.filters.colors = this.filters.colors.filter(c => c !== value);
                break;
            case 'price':
                this.filters.priceMin = null;
                this.filters.priceMax = null;
                break;
            case 'new':
                this.filters.isNew = null;
                break;
            case 'sale':
                this.filters.isOnSale = null;
                break;
            case 'search':
                this.filters.searchTerm = null;
                break;
        }
        this.filters.page = 1;
        this.loadProducts();
    },
    
    // ==================== UI UPDATES ====================
    
    updateResultsCount(count) {
        const el = document.getElementById('resultsCount');
        if (el) {
            el.textContent = `${count} produit${count !== 1 ? 's' : ''}`;
        }
    },
    
    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        const tagsContainer = document.getElementById('activeFiltersTags');
        const countBadge = document.getElementById('activeFiltersCount');
        
        if (!container || !tagsContainer) return;
        
        const tags = [];
        
        // Category tags
        this.filters.categoryIds.forEach(id => {
            const cat = this.categories.find(c => c.id === id);
            if (cat) {
                tags.push({
                    type: 'category',
                    value: id,
                    label: cat.name
                });
            }
        });
        
        // Gender tag
        if (this.filters.gender) {
            tags.push({
                type: 'gender',
                value: this.filters.gender,
                label: this.capitalizeFirst(this.filters.gender)
            });
        }
        
        // Brand tags
        this.filters.brands.forEach(brand => {
            tags.push({
                type: 'brand',
                value: brand,
                label: brand
            });
        });
        
        // Color tags
        this.filters.colors.forEach(color => {
            tags.push({
                type: 'color',
                value: color,
                label: this.capitalizeFirst(color)
            });
        });
        
        // Price range tag
        if (this.filters.priceMin !== null || this.filters.priceMax !== null) {
            const min = this.filters.priceMin || 0;
            const max = this.filters.priceMax || '∞';
            tags.push({
                type: 'price',
                value: 'price',
                label: `${min} - ${max} TND`
            });
        }
        
        // Special tags
        if (this.filters.isNew) {
            tags.push({ type: 'new', value: 'new', label: 'Nouveautés' });
        }
        if (this.filters.isOnSale) {
            tags.push({ type: 'sale', value: 'sale', label: 'En promotion' });
        }
        
        // Search tag
        if (this.filters.searchTerm) {
            tags.push({
                type: 'search',
                value: 'search',
                label: `"${this.filters.searchTerm}"`
            });
        }
        
        // Show/hide container
        if (tags.length > 0) {
            container.style.display = 'block';
            tagsContainer.innerHTML = tags.map(tag => `
                <span class="filter-tag">
                    ${this.escapeHtml(tag.label)}
                    <button onclick="CollectionsPage.removeFilter('${tag.type}', ${typeof tag.value === 'number' ? tag.value : `'${tag.value}'`})">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
            
            if (countBadge) {
                countBadge.textContent = tags.length;
                countBadge.style.display = 'inline';
            }
        } else {
            container.style.display = 'none';
            if (countBadge) countBadge.style.display = 'none';
        }
    },
    
    updateFacetCounts() {
        // Update gender options
        const genderContainer = document.getElementById('genderOptions');
        if (genderContainer && this.facets.genders) {
            genderContainer.innerHTML = this.facets.genders.map(g => `
                <label class="filter-checkbox">
                    <input type="checkbox" 
                           ${this.filters.gender === g.value ? 'checked' : ''}
                           onchange="CollectionsPage.onGenderChange('${g.value}')">
                    <span class="checkbox-custom"></span>
                    <span class="filter-label">${this.capitalizeFirst(g.value)}</span>
                    <span class="filter-count">(${g.count})</span>
                </label>
            `).join('');
        }
        
        // Update brand options
        const brandContainer = document.getElementById('brandOptions');
        if (brandContainer && this.facets.brands && this.facets.brands.length > 0) {
            document.getElementById('brandFilter').style.display = 'block';
            brandContainer.innerHTML = this.facets.brands.map(b => `
                <label class="filter-checkbox">
                    <input type="checkbox" 
                           ${this.filters.brands.includes(b.value) ? 'checked' : ''}
                           onchange="CollectionsPage.toggleBrand('${b.value}')">
                    <span class="checkbox-custom"></span>
                    <span class="filter-label">${this.escapeHtml(b.value)}</span>
                    <span class="filter-count">(${b.count})</span>
                </label>
            `).join('');
        } else if (document.getElementById('brandFilter')) {
            document.getElementById('brandFilter').style.display = 'none';
        }
        
        // Update color swatches
        const colorContainer = document.getElementById('colorSwatches');
        if (colorContainer && this.facets.colors && this.facets.colors.length > 0) {
            document.getElementById('colorFilter').style.display = 'block';
            colorContainer.innerHTML = this.facets.colors.map(c => {
                const colorCode = this.getColorCode(c.value);
                return `
                    <button class="color-swatch ${this.filters.colors.includes(c.value) ? 'active' : ''}"
                            style="background-color: ${colorCode};"
                            data-color="${c.value}"
                            onclick="CollectionsPage.toggleColor('${c.value}')"
                            title="${this.capitalizeFirst(c.value)} (${c.count})">
                        <span class="color-swatch-label">${this.capitalizeFirst(c.value)}</span>
                    </button>
                `;
            }).join('');
        } else if (document.getElementById('colorFilter')) {
            document.getElementById('colorFilter').style.display = 'none';
        }
        
        // Update price range
        if (this.facets.price_range) {
            const slider = document.getElementById('priceSlider');
            if (slider) {
                slider.min = this.facets.price_range.min || 0;
                slider.max = this.facets.price_range.max || 1000;
            }
        }
    },
    
    getColorCode(colorName) {
        const colorMap = {
            'noir': '#000000',
            'blanc': '#FFFFFF',
            'bleu': '#1e3a8a',
            'bleu clair': '#60a5fa',
            'gris': '#6b7280',
            'beige': '#d4a574',
            'rouge': '#dc2626',
            'vert': '#16a34a',
            'jaune': '#fbbf24',
            'rose': '#ec4899',
            'orange': '#f97316',
            'marron': '#92400e',
            'violet': '#7c3aed'
        };
        return colorMap[colorName.toLowerCase()] || '#888888';
    },
    
    // ==================== LOADING STATES ====================
    
    showLoading() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        grid.innerHTML = `
            <div class="pb-loading">
                <div class="pb-loading-spinner"></div>
                <p>Chargement...</p>
            </div>
        `;
    },
    
    showError() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        grid.innerHTML = `
            <div class="pb-no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement</p>
                <button class="pb-btn-reset" onclick="CollectionsPage.loadProducts()">
                    Réessayer
                </button>
            </div>
        `;
    },
    
    // ==================== PRODUCT MODAL ====================
    
    openProductModal(product) {
        const modal = document.getElementById('productModal');
        if (!modal) return;
        
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const modalDesc = document.getElementById('modalDesc');
        const modalPrice = document.getElementById('modalPrice');
        
        // Set image
        if (product.image_url && product.image_url.trim()) {
            modalImage.style.backgroundImage = `url('${product.image_url}')`;
            modalImage.innerHTML = '';
        } else {
            const gradient = product.gradient || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
            const icon = product.icon || 'fa-tshirt';
            modalImage.style.background = gradient;
            modalImage.innerHTML = `<i class="fas ${icon} placeholder-icon"></i>`;
        }
        
        // Set text content
        if (modalTitle) modalTitle.textContent = product.name;
        if (modalCategory) modalCategory.textContent = this.capitalizeFirst(product.gender || product.category || 'Collection');
        if (modalDesc) modalDesc.textContent = product.description || '';
        if (modalPrice) {
            if (product.price) {
                let priceHtml = `${product.price.toFixed(2)} TND`;
                if (product.price_original) {
                    priceHtml += ` <span style="text-decoration: line-through; color: var(--gray); font-size: 0.9rem;">${product.price_original.toFixed(2)} TND</span>`;
                }
                modalPrice.innerHTML = priceHtml;
            } else {
                modalPrice.textContent = 'Sur devis';
            }
        }
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    toggleFavorite(button, productId) {
        button.classList.toggle('active');
        const icon = button.querySelector('i');
        if (button.classList.contains('active')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        // Could save to localStorage or backend
    },
    
    // ==================== MOBILE MENU ====================
    
    initMobileMenu() {
        const toggle = document.getElementById('mobileFilterToggle');
        const sidebar = document.getElementById('filtersSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const closeBtn = document.getElementById('sidebarClose');
        
        if (toggle) {
            toggle.addEventListener('click', () => {
                sidebar?.classList.add('active');
                overlay?.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
        
        const closeSidebar = () => {
            sidebar?.classList.remove('active');
            overlay?.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        closeBtn?.addEventListener('click', closeSidebar);
        overlay?.addEventListener('click', closeSidebar);
        
        // Make closeSidebar globally available
        window.closeSidebar = closeSidebar;
    },
    
    initEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close modal
                const modal = document.getElementById('productModal');
                if (modal?.classList.contains('active')) {
                    closeProductModal();
                }
                // Close sidebar
                window.closeSidebar?.();
            }
        });
    },
    
    // ==================== UTILITIES ====================
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },
    
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    applyFilters() {
        this.loadProducts();
    }
};

// Global functions
function toggleFilterGroup(groupName) {
    const group = document.getElementById(`${groupName}Filter`);
    if (group) {
        group.classList.toggle('collapsed');
    }
}

// Zoom state for modal
let isZoomMode = false;
let currentZoomElement = null;

function openProductModalFromCard(cardElement) {
    try {
        if (!cardElement) {
            console.error('Élément de carte invalide');
            return;
        }
        
        openProductModal(
            cardElement.dataset.productName,
            cardElement.dataset.productDescription,
            cardElement.dataset.productCategory,
            cardElement.dataset.productGradient,
            cardElement.dataset.productIcon,
            cardElement.dataset.productImage,
            cardElement.dataset.productImage2
        );
    } catch (error) {
        console.error('Erreur lors de l\'ouverture des détails du produit:', error);
        alert('Erreur: Impossible d\'ouvrir les détails du produit. Veuillez réessayer.');
    }
}

function openProductModal(name, description, category, gradient, icon, imageUrl = null, imageUrl2 = null) {
    try {
        const modal = document.getElementById('productModal');
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalCategory = document.getElementById('modalCategory');
        
        // Check if all required elements exist
        if (!modal || !modalImage || !modalTitle || !modalDesc || !modalCategory) {
            console.error('Éléments de modal manquants');
            alert('Erreur: Les éléments de la fenêtre de détails sont manquants.');
            return;
        }

    // Reset state
    isZoomMode = false;
    currentZoomElement = null;

    // Set content with image if available
    if (imageUrl && imageUrl.trim()) {
        // Clean URLs
        const img1 = imageUrl.trim();
        const img2 = imageUrl2 && imageUrl2.trim() ? imageUrl2.trim() : null;

        modalImage.innerHTML = `
            <div class="pb-modal-image-wrapper">
                <div class="pb-modal-image-inner" 
                     id="zoomableImage"
                     style="background-image: url('${img1}'); background-size: cover; background-position: center; background-color: ${gradient || '#1e3a8a'}; cursor: zoom-in;" 
                     data-primary="${img1}" 
                     data-secondary="${img2 || ''}"
                     data-current="${img1}">
                    
                    ${img2 ? `
                        <div class="pb-image-toggles" style="position: absolute; bottom: 20px; left: 20px; display: flex; gap: 10px; z-index: 10;">
                            <div class="pb-thumb active" onclick="event.stopPropagation(); manualSwitchImage('${img1}')" style="width: 40px; height: 50px; background-image: url('${img1}'); background-size: cover; border: 2px solid white; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
                            <div class="pb-thumb" onclick="event.stopPropagation(); manualSwitchImage('${img2}')" style="width: 40px; height: 50px; background-image: url('${img2}'); background-size: cover; border: 1px solid rgba(255,255,255,0.5); cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const imageInner = document.getElementById('zoomableImage');

        // Click to toggle zoom
        imageInner.addEventListener('click', function (e) {
            toggleZoom(this, e);
        });

        // Mouse move for panning when zoomed
        imageInner.addEventListener('mousemove', function (e) {
            if (isZoomMode) {
                panImage(this, e);
            }
        });

        // Hover effect (only if not zoomed)
        if (img2) {
            imageInner.addEventListener('mouseenter', function () {
                if (!isZoomMode) {
                    this.style.backgroundImage = `url('${img2}')`;
                    this.dataset.current = img2;
                    updateActiveThumb(img2);
                }
            });
            imageInner.addEventListener('mouseleave', function () {
                if (!isZoomMode) {
                    this.style.backgroundImage = `url('${img1}')`;
                    this.dataset.current = img1;
                    updateActiveThumb(img1);
                }
            });
        }

    } else {
        modalImage.innerHTML = `
            <div class="pb-modal-image-inner" style="background: ${gradient || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'}; display: flex; align-items: center; justify-content: center;">
                <i class="fas ${icon || 'fa-tshirt'}" style="font-size: 8rem; color: rgba(255,255,255,0.2);"></i>
            </div>
        `;
    }

    modalTitle.textContent = name || 'Produit';
    modalDesc.textContent = description || '';
    modalCategory.textContent = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Collection';

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    } catch (error) {
        console.error('Erreur dans openProductModal:', error);
        alert('Erreur: Impossible d\'ouvrir les détails du produit. Veuillez réessayer.');
    }
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

function toggleZoom(element, event) {
    try {
        // Disable zoom on mobile/touch devices for better UX (handled by native pinch)
        if (isTouchDevice()) return;
        
        if (!element) {
            console.warn('Élément invalide pour le zoom');
            return;
        }

        if (!isZoomMode) {
            // ENABLE ZOOM
            isZoomMode = true;
            currentZoomElement = element;
            element.style.cursor = 'zoom-out';
            element.style.backgroundSize = '250%'; // Zoom level

            // Initial pan to click position
            panImage(element, event);

        } else {
            // DISABLE ZOOM
            disableZoom(element);
        }
    } catch (error) {
        console.error('Erreur lors du zoom:', error);
    }
}

function disableZoom(element) {
    try {
        if (!element) return;
        isZoomMode = false;
        currentZoomElement = null;

        // Reset logic
        element.style.cursor = 'zoom-in';
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';

        // Reset to current image (logic handles switching back if needed)
        const currentImg = element.dataset.current;
        if (currentImg) {
            element.style.backgroundImage = `url('${currentImg}')`;
        }
    } catch (error) {
        console.error('Erreur lors de la désactivation du zoom:', error);
    }
}

function panImage(element, event) {
    try {
        if (!element || !event) return;
        
        const rect = element.getBoundingClientRect();

        // Calculate mouse position as percentage of element size
        const x = (event.clientX - rect.left) / rect.width * 100;
        const y = (event.clientY - rect.top) / rect.height * 100;

        element.style.backgroundPosition = `${x}% ${y}%`;
    } catch (error) {
        console.error('Erreur lors du panoramique:', error);
    }
}

function manualSwitchImage(url) {
    try {
        const element = document.getElementById('zoomableImage');
        if (!element) {
            console.warn('Élément zoomableImage introuvable');
            return;
        }

        // If zoomed, reset zoom first
        if (isZoomMode) disableZoom(element);

        element.style.backgroundImage = `url('${url}')`;
        element.dataset.current = url;
        updateActiveThumb(url);
    } catch (error) {
        console.error('Erreur lors du changement d\'image:', error);
    }
}

function updateActiveThumb(url) {
    try {
        const thumbs = document.querySelectorAll('.pb-thumb');
        thumbs.forEach(thumb => {
            // Simple check if url contains the thumb's bg url
            const style = thumb.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
            if (url.includes(style) || style.includes(url)) {
                thumb.style.border = '2px solid white';
                thumb.style.opacity = '1';
            } else {
                thumb.style.border = '1px solid rgba(255,255,255,0.5)';
                thumb.style.opacity = '0.7';
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des miniatures:', error);
    }
}

function closeProductModal() {
    try {
        const modal = document.getElementById('productModal');
        if (!modal) {
            console.error('Modal introuvable');
            return;
        }
        
        modal.classList.remove('active');
        document.body.style.overflow = '';

        if (currentZoomElement) {
            disableZoom(currentZoomElement);
        }
    } catch (error) {
        console.error('Erreur lors de la fermeture du modal:', error);
    }
}

// Close modal on escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// ==================== SHOPPING CART FUNCTIONS ====================

// Add product to cart from card
function addToCartFromCard(button) {
    const product = {
        id: button.getAttribute('data-product-id'),
        name: button.getAttribute('data-product-name'),
        category: button.getAttribute('data-product-category'),
        image_url: button.getAttribute('data-product-image'),
        gradient: button.getAttribute('data-product-gradient'),
        icon: button.getAttribute('data-product-icon'),
        description: button.getAttribute('data-product-description')
    };
    
    if (typeof ShoppingCart !== 'undefined') {
        ShoppingCart.addToCart(product);
    } else {
        console.error('ShoppingCart service not loaded');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    CollectionsPage.init();
});

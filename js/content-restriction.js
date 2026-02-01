/**
 * Content Restriction Service
 * Handles user authentication, access control, and content restriction
 */

const ContentRestriction = {
    // Current user state
    currentUser: null,
    userProfile: null,
    userAccessLevel: 0,
    
    // Access level constants
    ACCESS_LEVELS: {
        VISITOR: 0,
        MEMBER: 1,
        PREMIUM: 2,
        ADMIN: 3
    },
    
    // Role names
    ROLE_NAMES: {
        0: 'Visiteur',
        1: 'Membre',
        2: 'Premium',
        3: 'Administrateur'
    },
    
    // ==================== INITIALIZATION ====================
    
    async init() {
        console.log('🔐 Initializing Content Restriction System...');
        
        // Check for existing session
        await this.checkAuthSession();
        
        // Update header UI based on auth state
        this.updateHeaderUI();
        
        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            if (event === 'SIGNED_IN') {
                this.handleSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            }
        });
        
        // Initialize restricted content on page
        this.initRestrictedContent();
        
        console.log('✅ Content Restriction System initialized');
    },
    
    // ==================== AUTHENTICATION ====================
    
    async checkAuthSession() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
            } else {
                this.currentUser = null;
                this.userProfile = null;
                this.userAccessLevel = 0;
            }
        } catch (error) {
            console.error('Error checking auth session:', error);
            this.currentUser = null;
            this.userAccessLevel = 0;
        }
    },
    
    async handleSignIn(session) {
        this.currentUser = session?.user || null;
        await this.loadUserProfile();
        this.updateHeaderUI();
        this.refreshRestrictedContent();
    },
    
    handleSignOut() {
        this.currentUser = null;
        this.userProfile = null;
        this.userAccessLevel = 0;
        this.updateHeaderUI();
        this.refreshRestrictedContent();
    },
    
    /**
     * Update the header user account UI
     */
    updateHeaderUI() {
        const accountBtn = document.getElementById('userAccountBtn');
        const guestMenu = document.getElementById('userMenuGuest');
        const loggedMenu = document.getElementById('userMenuLogged');
        const displayName = document.getElementById('userDisplayName');
        const accessBadge = document.getElementById('userAccessBadge');
        
        if (!accountBtn) return;
        
        if (this.currentUser) {
            // User is logged in
            accountBtn.classList.add('logged-in');
            accountBtn.innerHTML = '<i class="fas fa-user-check"></i>';
            
            if (guestMenu) guestMenu.style.display = 'none';
            if (loggedMenu) loggedMenu.style.display = 'block';
            
            if (displayName) {
                displayName.textContent = this.userProfile?.username || this.currentUser.email?.split('@')[0] || 'Mon Compte';
            }
            
            if (accessBadge) {
                const roleName = this.ROLE_NAMES[this.userAccessLevel] || 'Visiteur';
                const badgeColors = {
                    0: 'background: #6b7280;',
                    1: 'background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);',
                    2: 'background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);',
                    3: 'background: linear-gradient(135deg, #10b981 0%, #059669 100%);'
                };
                const badgeIcons = {
                    0: 'fa-user',
                    1: 'fa-star',
                    2: 'fa-crown',
                    3: 'fa-shield-halved'
                };
                accessBadge.innerHTML = `<i class="fas ${badgeIcons[this.userAccessLevel]}"></i> ${roleName}`;
                accessBadge.style.cssText = badgeColors[this.userAccessLevel];
            }
        } else {
            // User is logged out
            accountBtn.classList.remove('logged-in');
            accountBtn.innerHTML = '<i class="far fa-user"></i>';
            
            if (guestMenu) guestMenu.style.display = 'block';
            if (loggedMenu) loggedMenu.style.display = 'none';
        }
    },
    
    async loadUserProfile() {
        if (!this.currentUser) return;
        
        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                this.userProfile = data;
                this.userAccessLevel = data.access_level || 0;
            } else {
                // Create profile if doesn't exist
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.userAccessLevel = 0;
        }
    },
    
    async createUserProfile() {
        if (!this.currentUser) return;
        
        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .insert({
                    id: this.currentUser.id,
                    email: this.currentUser.email,
                    username: this.currentUser.email?.split('@')[0],
                    role: 'visitor',
                    access_level: 0
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.userProfile = data;
            this.userAccessLevel = 0;
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    },
    
    // ==================== SIGN UP / SIGN IN ====================
    
    async signUp(email, password, username = null) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username || email.split('@')[0]
                    }
                }
            });
            
            if (error) throw error;
            
            return { success: true, data, message: 'Vérifiez votre email pour confirmer votre compte' };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },
    
    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ==================== ACCESS CHECKING ====================
    
    /**
     * Check if current user has access to content
     * @param {number} minAccessLevel - Minimum required access level
     * @param {string} contentType - Type of content (product, news, etc.)
     * @param {string} contentId - ID of the content
     * @returns {boolean}
     */
    hasAccess(minAccessLevel, contentType = null, contentId = null) {
        // No restriction
        if (!minAccessLevel || minAccessLevel === 0) return true;
        
        // Check user's general access level
        if (this.userAccessLevel >= minAccessLevel) return true;
        
        // If content-specific, check individual grants
        if (contentType && contentId) {
            return this.checkContentGrant(contentType, contentId);
        }
        
        return false;
    },
    
    async checkContentGrant(contentType, contentId) {
        if (!this.currentUser) return false;
        
        try {
            const { data, error } = await supabaseClient
                .from('user_access_grants')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('content_type', contentType)
                .eq('content_id', contentId)
                .eq('is_active', true)
                .single();
            
            if (error) return false;
            
            // Check expiration
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * Check access using RPC function (server-side validation)
     */
    async checkAccessServer(contentType, contentId) {
        if (!this.currentUser) return false;
        
        try {
            const { data, error } = await supabaseClient.rpc('check_user_access', {
                p_user_id: this.currentUser.id,
                p_content_type: contentType,
                p_content_id: contentId
            });
            
            if (error) throw error;
            return data === true;
        } catch (error) {
            console.error('Error checking server access:', error);
            return false;
        }
    },
    
    // ==================== CONTENT RENDERING ====================
    
    /**
     * Initialize all restricted content on page
     */
    initRestrictedContent() {
        // Find all elements with data-min-access attribute
        const restrictedElements = document.querySelectorAll('[data-min-access]');
        
        restrictedElements.forEach(element => {
            this.processRestrictedElement(element);
        });
        
        // Find all restricted cards
        const restrictedCards = document.querySelectorAll('.article-card[data-restricted="true"], .pb-product-card[data-restricted="true"]');
        
        restrictedCards.forEach(card => {
            this.applyCardRestriction(card);
        });
    },
    
    /**
     * Refresh all restricted content (after auth change)
     */
    refreshRestrictedContent() {
        this.initRestrictedContent();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('accessLevelChanged', {
            detail: { accessLevel: this.userAccessLevel }
        }));
    },
    
    /**
     * Process a single restricted element
     */
    processRestrictedElement(element) {
        const minAccess = parseInt(element.dataset.minAccess) || 0;
        const hasAccess = this.hasAccess(minAccess);
        
        if (hasAccess) {
            element.classList.remove('restricted', 'locked');
            this.removeRestrictionOverlay(element);
        } else {
            element.classList.add('restricted', 'locked');
            this.applyRestriction(element, minAccess);
        }
    },
    
    /**
     * Apply restriction to an element
     */
    applyRestriction(element, minAccessLevel) {
        // Check if overlay already exists
        if (element.querySelector('.lock-overlay')) return;
        
        const roleName = this.ROLE_NAMES[minAccessLevel] || 'Premium';
        
        // Create lock overlay
        const overlay = document.createElement('div');
        overlay.className = 'lock-overlay';
        overlay.innerHTML = `
            <span class="lock-badge"><i class="fas fa-lock"></i> Contenu ${roleName}</span>
            <span class="lock-icon">🔒</span>
            <span class="lock-text">Passez à ${roleName} pour débloquer</span>
            <button class="unlock-btn-small" onclick="ContentRestriction.showUpgradeModal(${minAccessLevel})">
                <i class="fas fa-unlock"></i> Débloquer
            </button>
        `;
        
        // Handle images
        const images = element.querySelectorAll('img:not(.blurred)');
        images.forEach(img => {
            img.classList.add('blurred');
        });
        
        // Handle background images
        const imageContainers = element.querySelectorAll('.restricted-image, .card-image, .pb-product-image');
        imageContainers.forEach(container => {
            if (!container.querySelector('.lock-overlay')) {
                container.style.position = 'relative';
                container.appendChild(overlay.cloneNode(true));
            }
        });
        
        // If no image container, add to element itself
        if (imageContainers.length === 0) {
            element.style.position = 'relative';
            element.appendChild(overlay);
        }
    },
    
    /**
     * Remove restriction overlay from element
     */
    removeRestrictionOverlay(element) {
        // Remove overlays
        const overlays = element.querySelectorAll('.lock-overlay');
        overlays.forEach(overlay => overlay.remove());
        
        // Unblur images
        const blurredImages = element.querySelectorAll('img.blurred');
        blurredImages.forEach(img => img.classList.remove('blurred'));
    },
    
    /**
     * Apply restriction to a card component
     */
    applyCardRestriction(card) {
        const minAccess = parseInt(card.dataset.minAccess) || 1;
        const hasAccess = this.hasAccess(minAccess);
        
        if (hasAccess) {
            card.classList.remove('restricted');
            this.removeRestrictionOverlay(card);
            
            // Restore click handler
            card.style.pointerEvents = '';
            return;
        }
        
        // Apply restriction
        card.classList.add('restricted');
        
        // Blur image
        const imageInner = card.querySelector('.pb-product-image-inner, .card-image img');
        if (imageInner) {
            if (imageInner.tagName === 'IMG') {
                imageInner.classList.add('blurred');
            } else {
                imageInner.style.filter = 'blur(12px)';
                imageInner.style.transform = 'scale(1.1)';
            }
        }
        
        // Add lock badge
        const imageContainer = card.querySelector('.pb-product-image, .card-image');
        if (imageContainer && !imageContainer.querySelector('.restricted-badge')) {
            const roleName = this.ROLE_NAMES[minAccess] || 'Premium';
            const badge = document.createElement('span');
            badge.className = `restricted-badge ${minAccess >= 2 ? 'premium-only' : 'member-only'}`;
            badge.innerHTML = `<i class="fas fa-lock"></i> ${roleName}`;
            imageContainer.appendChild(badge);
        }
        
        // Override click to show upgrade modal
        card.addEventListener('click', (e) => {
            if (!this.hasAccess(minAccess)) {
                e.preventDefault();
                e.stopPropagation();
                this.showUpgradeModal(minAccess);
            }
        }, { capture: true });
    },
    
    // ==================== RENDER HELPERS ====================
    
    /**
     * Render a restricted article card
     */
    renderRestrictedCard(article, userAccessLevel = null) {
        const accessLevel = userAccessLevel ?? this.userAccessLevel;
        const minAccess = article.min_access_level || 0;
        const hasAccess = accessLevel >= minAccess;
        const roleName = this.ROLE_NAMES[minAccess] || 'Premium';
        
        if (hasAccess || minAccess === 0) {
            // Full access - render normally
            return `
                <div class="article-card" data-id="${article.id}">
                    <div class="card-image">
                        <img src="${article.image_url || ''}" alt="${article.title}">
                    </div>
                    <div class="card-content">
                        <span class="card-category">${article.category || ''}</span>
                        <h3 class="card-title">${article.title}</h3>
                        <p class="card-excerpt">${article.content || article.description || ''}</p>
                    </div>
                </div>
            `;
        }
        
        // Restricted - show blurred/locked version
        const preview = article.restricted_preview || 
            (article.content ? article.content.substring(0, 100) + '...' : '');
        
        return `
            <div class="article-card restricted" data-id="${article.id}" data-min-access="${minAccess}" data-restricted="true">
                <div class="card-image restricted-image">
                    <img src="${article.image_url || ''}" alt="${article.title}" class="blurred">
                    <div class="lock-overlay">
                        <span class="lock-badge ${minAccess >= 2 ? 'premium-only' : ''}">
                            <i class="fas fa-lock"></i> ${roleName}
                        </span>
                        <span class="lock-icon">🔒</span>
                    </div>
                    <span class="restricted-badge ${minAccess >= 2 ? 'premium-only' : 'member-only'}">
                        <i class="fas fa-lock"></i> ${roleName}
                    </span>
                </div>
                <div class="card-content">
                    <span class="card-category">${article.category || ''}</span>
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-excerpt restricted-text">${preview}</p>
                    <button class="upgrade-prompt ${minAccess >= 2 ? 'premium' : ''}" 
                            onclick="ContentRestriction.showUpgradeModal(${minAccess})">
                        <i class="fas fa-unlock"></i> Débloquer avec ${roleName}
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Render a restricted product card (Pull&Bear style)
     */
    renderRestrictedProductCard(product, userAccessLevel = null) {
        const accessLevel = userAccessLevel ?? this.userAccessLevel;
        const minAccess = product.min_access_level || 0;
        const hasAccess = accessLevel >= minAccess;
        const roleName = this.ROLE_NAMES[minAccess] || 'Premium';
        
        const category = product.gender || product.category || 'Collection';
        const gradient = product.gradient || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
        const hasImage = product.image_url && product.image_url.trim();
        
        // Build badge
        let badge = '';
        if (product.is_new) badge = '<span class="pb-badge pb-badge-new">Nouveau</span>';
        else if (product.is_on_sale) badge = '<span class="pb-badge pb-badge-sale">Promo</span>';
        
        if (!hasAccess && minAccess > 0) {
            // Restricted card
            return `
                <div class="pb-product-card restricted" 
                     data-id="${product.id}"
                     data-min-access="${minAccess}"
                     data-restricted="true"
                     onclick="ContentRestriction.showUpgradeModal(${minAccess})">
                    <div class="pb-product-image restricted-image">
                        <div class="pb-product-image-inner blurred-bg" 
                             style="background-image: url('${product.image_url || ''}'); 
                                    filter: blur(12px); transform: scale(1.1);
                                    ${!hasImage ? `background: ${gradient};` : ''}">
                        </div>
                        
                        <div class="lock-overlay">
                            <span class="lock-badge"><i class="fas fa-lock"></i> ${roleName}</span>
                            <span class="lock-icon">🔒</span>
                            <button class="unlock-btn-small">
                                <i class="fas fa-unlock"></i> Débloquer
                            </button>
                        </div>
                        
                        <span class="restricted-badge ${minAccess >= 2 ? 'premium-only' : 'member-only'}">
                            <i class="fas fa-lock"></i> ${roleName}
                        </span>
                    </div>
                    
                    <div class="pb-product-info">
                        <span class="pb-product-category">${this.capitalizeFirst(category)}</span>
                        <h3 class="pb-product-name">${product.name}</h3>
                        <p class="pb-product-desc restricted-text">${product.restricted_preview || 'Contenu réservé...'}</p>
                        
                        <button class="upgrade-prompt ${minAccess >= 2 ? 'premium' : ''}" 
                                onclick="event.stopPropagation(); ContentRestriction.showUpgradeModal(${minAccess})">
                            <i class="fas fa-unlock"></i> Débloquer
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Normal unrestricted card
        return `
            <div class="pb-product-card" 
                 data-id="${product.id}"
                 data-product-name="${this.escapeHtml(product.name)}"
                 data-product-description="${this.escapeHtml(product.description || '')}"
                 data-product-category="${this.escapeHtml(category)}"
                 data-product-gradient="${gradient}"
                 data-product-image="${this.escapeHtml(product.image_url || '')}"
                 data-product-image2="${this.escapeHtml(product.image_url_2 || '')}"
                 onclick="openProductModalFromCard(this)">
                <div class="pb-product-image">
                    <div class="pb-product-image-inner" 
                         style="background-image: url('${product.image_url || ''}'); 
                                background-size: cover; background-position: center;
                                ${!hasImage ? `background: ${gradient};` : ''}"
                         data-image-alt="${product.image_url_2 || ''}">
                        ${!hasImage ? `<i class="fas ${product.icon || 'fa-tshirt'}"></i>` : ''}
                    </div>
                    
                    ${badge}
                    
                    <button class="pb-favorite-btn" onclick="event.stopPropagation(); toggleFavorite(this, event)">
                        <i class="far fa-heart"></i>
                    </button>

                    <div class="pb-quick-actions">
                        <a href="quote.html" class="pb-quick-btn pb-quick-btn-primary" onclick="event.stopPropagation()">
                            <i class="fas fa-file-invoice"></i>
                            <span>Devis</span>
                        </a>
                    </div>
                </div>
                
                <div class="pb-product-info">
                    <span class="pb-product-category">${this.capitalizeFirst(category)}</span>
                    <h3 class="pb-product-name">${product.name}</h3>
                    <p class="pb-product-desc">${product.description || ''}</p>
                    
                    <div class="pb-product-price">
                        <span class="pb-price-current">Sur devis</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==================== UPGRADE MODAL ====================
    
    showUpgradeModal(requiredLevel = 1) {
        const roleName = this.ROLE_NAMES[requiredLevel] || 'Premium';
        const isLoggedIn = !!this.currentUser;
        
        // Create modal if not exists
        let modal = document.getElementById('accessModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'accessModal';
            modal.className = 'access-modal';
            document.body.appendChild(modal);
        }
        
        if (isLoggedIn) {
            // User is logged in but needs higher access
            modal.innerHTML = `
                <div class="access-modal-content">
                    <button class="access-modal-close" onclick="ContentRestriction.closeUpgradeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="access-modal-icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    <h3>Contenu ${roleName}</h3>
                    <p>Ce contenu est réservé aux membres ${roleName}. Passez à un abonnement supérieur pour y accéder.</p>
                    <div class="access-modal-actions">
                        <button class="btn-primary" onclick="ContentRestriction.goToPlans()">
                            <i class="fas fa-rocket"></i> Voir les abonnements
                        </button>
                        <button class="btn-secondary" onclick="ContentRestriction.closeUpgradeModal()">
                            Plus tard
                        </button>
                    </div>
                </div>
            `;
        } else {
            // User not logged in
            modal.innerHTML = `
                <div class="access-modal-content">
                    <button class="access-modal-close" onclick="ContentRestriction.closeUpgradeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="access-modal-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3>Contenu réservé</h3>
                    <p>Connectez-vous ou créez un compte pour accéder à ce contenu ${roleName === 'Membre' ? '' : `réservé aux membres ${roleName}`}.</p>
                    <div class="access-modal-actions">
                        <button class="btn-primary" onclick="ContentRestriction.goToLogin()">
                            <i class="fas fa-sign-in-alt"></i> Se connecter
                        </button>
                        <button class="btn-secondary" onclick="ContentRestriction.goToSignup()">
                            <i class="fas fa-user-plus"></i> Créer un compte
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    },
    
    closeUpgradeModal() {
        const modal = document.getElementById('accessModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    goToLogin() {
        this.closeUpgradeModal();
        window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
    },
    
    goToSignup() {
        this.closeUpgradeModal();
        window.location.href = 'auth.html?mode=signup&redirect=' + encodeURIComponent(window.location.href);
    },
    
    goToPlans() {
        this.closeUpgradeModal();
        window.location.href = 'subscription.html';
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
    
    /**
     * Get access badge HTML
     */
    getAccessBadge(accessLevel) {
        const badges = {
            0: '<span class="access-badge free"><i class="fas fa-globe"></i> Public</span>',
            1: '<span class="access-badge member"><i class="fas fa-user"></i> Membre</span>',
            2: '<span class="access-badge premium"><i class="fas fa-crown"></i> Premium</span>',
            3: '<span class="access-badge enterprise"><i class="fas fa-building"></i> Enterprise</span>'
        };
        return badges[accessLevel] || badges[0];
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    },
    
    /**
     * Get current user's role name
     */
    getCurrentRoleName() {
        return this.ROLE_NAMES[this.userAccessLevel] || 'Visiteur';
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Only init if supabaseClient exists
    if (typeof supabaseClient !== 'undefined') {
        ContentRestriction.init();
    }
});

// Make globally available
window.ContentRestriction = ContentRestriction;

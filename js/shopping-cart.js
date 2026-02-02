/**
 * Shopping Cart Management System
 * Handles cart operations for Primavet
 */

const ShoppingCart = {
    cart: [],
    cartKey: 'primavet_shopping_cart',
    
    // Initialize cart from localStorage
    init() {
        this.loadCart();
        this.updateCartUI();
        this.attachEventListeners();
        console.log('🛒 Shopping Cart initialized');
    },
    
    // Load cart from localStorage
    loadCart() {
        try {
            const saved = localStorage.getItem(this.cartKey);
            this.cart = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    },
    
    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
            this.updateCartUI();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    },
    
    // Add product to cart
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                category: product.category || product.gender,
                image: product.image_url,
                gradient: product.gradient,
                icon: product.icon,
                description: product.description,
                quantity: 1,
                addedAt: Date.now()
            });
        }
        
        this.saveCart();
        this.showNotification(`${product.name} ajouté au panier`, 'success');
    },
    
    // Remove product from cart
    removeFromCart(productId) {
        const item = this.cart.find(item => item.id === productId);
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.showNotification(`${item ? item.name : 'Produit'} retiré du panier`, 'success');
        
        // Update the cart modal immediately
        const modalBody = document.querySelector('.cart-modal-body');
        if (modalBody) {
            modalBody.innerHTML = this.renderCartItems();
        }
        
        // Update total and attach event listeners to new buttons
        const cartTotal = document.querySelector('.cart-total strong');
        if (cartTotal) {
            const count = this.getCartCount();
            cartTotal.textContent = `${count} article${count > 1 ? 's' : ''}`;
        }
    },
    
    // Update quantity
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                
                // Update the quantity display in the modal
                const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
                if (cartItem) {
                    cartItem.querySelector('.qty-value').textContent = quantity;
                }
                
                // Update total count
                const cartTotal = document.querySelector('.cart-total strong');
                if (cartTotal) {
                    const count = this.getCartCount();
                    cartTotal.textContent = `${count} article${count > 1 ? 's' : ''}`;
                }
            }
        }
    },
    
    // Clear entire cart
    clearCart() {
        if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
            this.cart = [];
            this.saveCart();
            this.showNotification('Panier vidé', 'info');
        }
    },
    
    // Get cart count
    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    },
    
    // Check if product is in cart
    isInCart(productId) {
        return this.cart.some(item => item.id === productId);
    },
    
    // Update cart UI (badge count)
    updateCartUI() {
        const count = this.getCartCount();
        const badge = document.querySelector('.cart-badge');
        
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Update cart button icons on product cards
        document.querySelectorAll('.pb-cart-btn').forEach(btn => {
            const productId = btn.getAttribute('data-product-id');
            if (productId && this.isInCart(productId)) {
                btn.classList.add('in-cart');
                btn.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                btn.classList.remove('in-cart');
                btn.innerHTML = '<i class="fas fa-shopping-cart"></i>';
            }
        });
    },
    
    // Show cart modal
    showCartModal() {
        const modal = this.createCartModal();
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => modal.classList.add('active'), 10);
    },
    
    // Create cart modal HTML
    createCartModal() {
        const modal = document.createElement('div');
        modal.className = 'cart-modal';
        modal.innerHTML = `
            <div class="cart-modal-overlay" onclick="ShoppingCart.closeCartModal()"></div>
            <div class="cart-modal-content">
                <div class="cart-modal-header">
                    <h2><i class="fas fa-shopping-cart"></i> Votre Panier</h2>
                    <button class="cart-modal-close" onclick="ShoppingCart.closeCartModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="cart-modal-body">
                    ${this.renderCartItems()}
                </div>
                
                <div class="cart-modal-footer">
                    <div class="cart-total">
                        <span>Total articles:</span>
                        <strong>${this.getCartCount()} article${this.getCartCount() > 1 ? 's' : ''}</strong>
                    </div>
                    <div class="cart-actions">
                        <button class="btn btn-secondary" onclick="ShoppingCart.clearCart()">
                            <i class="fas fa-trash"></i> Vider le panier
                        </button>
                        <button class="btn btn-primary" onclick="ShoppingCart.sendToQuote()">
                            <i class="fas fa-file-invoice"></i> Demander un devis
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    },
    
    // Render cart items
    renderCartItems() {
        if (this.cart.length === 0) {
            return `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Votre panier est vide</p>
                    <a href="collections.html" class="btn btn-primary">Explorer les collections</a>
                </div>
            `;
        }
        
        return `
            <div class="cart-items">
                ${this.cart.map(item => this.renderCartItem(item)).join('')}
            </div>
        `;
    },
    
    // Render single cart item
    renderCartItem(item) {
        const hasImage = item.image && item.image.trim();
        const imageStyle = hasImage 
            ? `background-image: url('${item.image}'); background-size: cover; background-position: center;`
            : `background: ${item.gradient || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'};`;
        
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item-image" style="${imageStyle}">
                    ${!hasImage ? `<i class="fas ${item.icon || 'fa-tshirt'}"></i>` : ''}
                </div>
                
                <div class="cart-item-details">
                    <h4>${this.escapeHtml(item.name)}</h4>
                    <p class="cart-item-category">${this.escapeHtml(item.category || 'Produit')}</p>
                    <p class="cart-item-desc">${this.escapeHtml(item.description || '')}</p>
                </div>
                
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="ShoppingCart.updateQuantity('${item.id}', ${item.quantity - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="ShoppingCart.updateQuantity('${item.id}', ${item.quantity + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <button class="cart-item-remove" onclick="ShoppingCart.removeFromCart('${item.id}')" title="Retirer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    },
    
    // Close cart modal
    closeCartModal() {
        const modal = document.querySelector('.cart-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // Send cart to quote page
    sendToQuote() {
        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide', 'info');
            return;
        }
        
        // Save cart to sessionStorage for quote page
        sessionStorage.setItem('quote_cart_items', JSON.stringify(this.cart));
        
        // Redirect to quote page
        window.location.href = 'quote.html?from_cart=true';
    },
    
    // Show notification
    showNotification(message, type = 'success') {
        // Use existing showToast if available
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Attach event listeners
    attachEventListeners() {
        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCartModal();
            }
        });
    },
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShoppingCart.init());
} else {
    ShoppingCart.init();
}

/**
 * Form Handler
 * Handles all public form submissions to Supabase
 * Includes validation, sanitization, and security measures
 */

const FormHandler = {
    // Configuration
    config: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: {
            cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        },
        honeypotFieldName: 'website_url', // Honeypot field for bot detection
        submissionCooldown: 10000, // 10 seconds between submissions
        lastSubmissionTime: {}
    },

    /**
     * Initialize form handlers
     */
    init() {
        this.initContactForm();
        this.initQuoteForm();
        this.initApplicationForm();
        this.initSuggestionForm();
        this.addHoneypotFields();
        console.log('✅ Form Handler initialized with security enhancements');
    },

    /**
     * Add honeypot fields to all forms for bot detection
     */
    addHoneypotFields() {
        document.querySelectorAll('form').forEach(form => {
            if (!form.querySelector(`[name="${this.config.honeypotFieldName}"]`)) {
                const honeypot = document.createElement('input');
                honeypot.type = 'text';
                honeypot.name = this.config.honeypotFieldName;
                honeypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0; pointer-events: none;';
                honeypot.tabIndex = -1;
                honeypot.autocomplete = 'off';
                honeypot.setAttribute('aria-hidden', 'true');
                form.appendChild(honeypot);
            }
        });
    },

    /**
     * Check for bot submissions (honeypot)
     */
    isBot(form) {
        const honeypot = form.querySelector(`[name="${this.config.honeypotFieldName}"]`);
        return honeypot && honeypot.value.length > 0;
    },

    /**
     * Check submission cooldown (rate limiting)
     */
    canSubmit(formId) {
        const now = Date.now();
        const lastTime = this.config.lastSubmissionTime[formId] || 0;
        
        if (now - lastTime < this.config.submissionCooldown) {
            return false;
        }
        
        this.config.lastSubmissionTime[formId] = now;
        return true;
    },

    /**
     * Sanitize text input
     */
    sanitizeInput(str) {
        if (!str) return '';
        return String(str)
            .trim()
            .replace(/[<>]/g, '') // Remove angle brackets
            .substring(0, 10000); // Limit length
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    },

    /**
     * Validate phone format
     */
    isValidPhone(phone) {
        if (!phone) return true; // Optional field
        const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Validate file
     */
    validateFile(file, type = 'cv') {
        if (!file) return { valid: true };
        
        // Check file size
        if (file.size > this.config.maxFileSize) {
            return { valid: false, error: `Le fichier est trop volumineux (max ${this.config.maxFileSize / 1024 / 1024}MB)` };
        }
        
        // Check file type
        const allowedTypes = this.config.allowedFileTypes[type] || [];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}` };
        }
        
        // Check file extension matches MIME type
        const extension = file.name.split('.').pop().toLowerCase();
        const validExtensions = {
            'application/pdf': ['pdf'],
            'application/msword': ['doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'image/gif': ['gif'],
            'image/webp': ['webp']
        };
        
        if (validExtensions[file.type] && !validExtensions[file.type].includes(extension)) {
            return { valid: false, error: 'L\'extension du fichier ne correspond pas à son type' };
        }
        
        return { valid: true };
    },

    /**
     * Contact Form Handler
     */
    initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(form, 'contact');
        });
    },

    /**
     * Quote Form Handler
     */
    initQuoteForm() {
        const form = document.getElementById('quoteForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(form, 'quote');
        });
    },

    /**
     * Application Form Handler
     */
    initApplicationForm() {
        const form = document.getElementById('applicationForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleApplicationSubmit(form);
        });
    },

    /**
     * Suggestion Form Handler
     */
    initSuggestionForm() {
        const form = document.getElementById('suggestionForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSuggestionSubmit(form);
        });
    },

    /**
     * Generic form submission handler
     */
    async handleFormSubmit(form, formType) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Security checks
        if (this.isBot(form)) {
            console.warn('Bot detected, silently rejecting');
            this.showSuccess(form, this.getSuccessMessage(formType)); // Fake success for bots
            return;
        }

        if (!this.canSubmit(form.id || formType)) {
            this.showError(form, 'Veuillez patienter avant de soumettre à nouveau.');
            return;
        }

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            // Collect and validate form data
            const formData = new FormData(form);
            
            // Validate required fields
            const name = this.sanitizeInput(formData.get('name'));
            const email = formData.get('email')?.trim();
            
            if (!name || name.length < 2) {
                throw new Error('Veuillez entrer un nom valide');
            }
            
            if (!email || !this.isValidEmail(email)) {
                throw new Error('Veuillez entrer une adresse e-mail valide');
            }
            
            const phone = formData.get('phone');
            if (phone && !this.isValidPhone(phone)) {
                throw new Error('Veuillez entrer un numéro de téléphone valide');
            }

            const data = this.collectFormData(formData, formType);

            // Check rate limiter
            if (typeof RateLimiter !== 'undefined' && !RateLimiter.canMakeRequest('form_' + formType)) {
                throw new Error('Trop de soumissions. Veuillez patienter.');
            }

            // Send to Supabase
            const { error } = await supabaseClient
                .from('messages')
                .insert([data]);

            if (error) throw error;

            // Show success
            this.showSuccess(form, this.getSuccessMessage(formType));
            form.reset();

        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(form, error.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Handle job application with file upload
     */
    async handleApplicationSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Security checks
        if (this.isBot(form)) {
            this.showSuccess(form, 'Votre candidature a été envoyée avec succès !');
            return;
        }

        if (!this.canSubmit('applicationForm')) {
            this.showError(form, 'Veuillez patienter avant de soumettre à nouveau.');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            const formData = new FormData(form);
            
            // Validate inputs
            const name = this.sanitizeInput(formData.get('name'));
            const email = formData.get('email')?.trim();
            
            if (!name || name.length < 2) {
                throw new Error('Veuillez entrer un nom valide');
            }
            
            if (!email || !this.isValidEmail(email)) {
                throw new Error('Veuillez entrer une adresse e-mail valide');
            }

            let cvUrl = null;

            // Handle CV upload if file exists
            const cvFile = form.querySelector('#candidate-cv')?.files[0];
            if (cvFile) {
                const validation = this.validateFile(cvFile, 'cv');
                if (!validation.valid) {
                    throw new Error(validation.error);
                }
                cvUrl = await this.uploadFile(cvFile, 'cv');
            }

            // Prepare data
            const data = {
                form_type: 'application',
                name: name,
                email: email,
                phone: this.sanitizeInput(formData.get('phone')) || null,
                message: this.sanitizeInput(formData.get('message')) || null,
                job_id: this.sanitizeInput(formData.get('position')) || null,
                metadata: {
                    cv_url: cvUrl,
                    position: this.sanitizeInput(formData.get('position'))
                }
            };

            // Send to Supabase
            const { error } = await supabaseClient
                .from('messages')
                .insert([data]);

            if (error) throw error;

            this.showSuccess(form, 'Votre candidature a été envoyée avec succès ! Nous vous contacterons bientôt.');
            form.reset();

        } catch (error) {
            console.error('Application submission error:', error);
            this.showError(form, 'Une erreur est survenue lors de l\'envoi de votre candidature.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Handle suggestion form with image upload
     */
    async handleSuggestionSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Security checks
        if (this.isBot(form)) {
            this.showSuccess(form, 'Votre suggestion a été envoyée avec succès !');
            return;
        }

        if (!this.canSubmit('suggestionForm')) {
            this.showError(form, 'Veuillez patienter avant de soumettre à nouveau.');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            const formData = new FormData(form);
            
            // Validate inputs
            const name = this.sanitizeInput(formData.get('name'));
            const email = formData.get('email')?.trim();
            
            if (!name || name.length < 2) {
                throw new Error('Veuillez entrer un nom valide');
            }
            
            if (!email || !this.isValidEmail(email)) {
                throw new Error('Veuillez entrer une adresse e-mail valide');
            }

            let imageUrl = null;

            // Handle image upload if file exists
            const imageFile = form.querySelector('#outfit-image')?.files[0];
            if (imageFile) {
                const validation = this.validateFile(imageFile, 'image');
                if (!validation.valid) {
                    throw new Error(validation.error);
                }
                imageUrl = await this.uploadFile(imageFile, 'suggestions');
            }

            // Prepare data
            const data = {
                form_type: 'suggestion',
                name: name,
                email: email,
                message: this.sanitizeInput(formData.get('message')) || null,
                metadata: {
                    image_url: imageUrl
                }
            };

            // Send to Supabase
            const { error } = await supabaseClient
                .from('messages')
                .insert([data]);

            if (error) throw error;

            this.showSuccess(form, 'Votre suggestion a été envoyée avec succès ! Merci pour votre contribution.');
            form.reset();

        } catch (error) {
            console.error('Suggestion submission error:', error);
            this.showError(form, error.message || 'Une erreur est survenue lors de l\'envoi de votre suggestion.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Upload file to Supabase Storage with validation
     */
    async uploadFile(file, bucket) {
        // Generate safe filename (remove special chars, add timestamp)
        const safeFileName = file.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeFileName}`;
        const filePath = `${bucket}/${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('uploads')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('File upload error:', error);
            throw new Error('Erreur lors du téléchargement du fichier');
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('uploads')
            .getPublicUrl(filePath);

        return urlData?.publicUrl || null;
    },

    /**
     * Collect form data based on form type with sanitization
     */
    collectFormData(formData, formType) {
        const baseData = {
            form_type: formType,
            name: this.sanitizeInput(formData.get('name')),
            email: formData.get('email')?.trim() || null,
            phone: this.sanitizeInput(formData.get('phone')) || null,
            message: this.sanitizeInput(formData.get('message') || formData.get('details')) || null
        };

        switch (formType) {
            case 'contact':
                return {
                    ...baseData,
                    subject: this.sanitizeInput(formData.get('subject')) || null
                };

            case 'quote':
                return {
                    ...baseData,
                    company: this.sanitizeInput(formData.get('company')) || null,
                    product_interest: this.sanitizeInput(formData.get('category')) || null,
                    quantity: this.sanitizeInput(formData.get('quantity')) || null,
                    metadata: {
                        request_type: this.sanitizeInput(formData.get('request_type')),
                        address: this.sanitizeInput(formData.get('address')),
                        product: this.sanitizeInput(formData.get('product')),
                        deadline: this.sanitizeInput(formData.get('deadline')),
                        customization: formData.getAll('customization[]').map(c => this.sanitizeInput(c)),
                        budget: this.sanitizeInput(formData.get('budget')),
                        source: this.sanitizeInput(formData.get('source')),
                        newsletter: formData.get('newsletter') === 'on'
                    }
                };

            default:
                return baseData;
        }
    },

    /**
     * Get success message based on form type
     */
    getSuccessMessage(formType) {
        const messages = {
            contact: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.',
            quote: 'Votre demande de devis a été envoyée ! Nous vous contacterons sous 24-48h.',
            application: 'Votre candidature a été envoyée avec succès !',
            suggestion: 'Votre suggestion a été envoyée avec succès !'
        };
        return messages[formType] || 'Formulaire envoyé avec succès !';
    },

    /**
     * Show success message
     */
    showSuccess(form, message) {
        // Remove any existing messages
        form.querySelectorAll('.form-message').forEach(el => el.remove());

        const successDiv = document.createElement('div');
        successDiv.className = 'form-message form-success';
        successDiv.innerHTML = `
            <div style="background: #22c55e; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;">
                <i class="fas fa-check-circle"></i> <strong>${message}</strong>
            </div>
        `;
        form.insertBefore(successDiv, form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);
    },

    /**
     * Show error message
     */
    showError(form, message) {
        // Remove any existing messages
        form.querySelectorAll('.form-message').forEach(el => el.remove());

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-message form-error';
        errorDiv.innerHTML = `
            <div style="background: #ef4444; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;">
                <i class="fas fa-exclamation-circle"></i> <strong>${message}</strong>
            </div>
        `;
        form.insertBefore(errorDiv, form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if supabaseClient is available
    if (typeof supabaseClient !== 'undefined') {
        FormHandler.init();
    }
});

// Export for use
window.FormHandler = FormHandler;

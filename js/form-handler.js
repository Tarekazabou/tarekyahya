/**
 * Form Handler
 * Handles all public form submissions to Supabase
 */

const FormHandler = {
    /**
     * Initialize form handlers
     */
    init() {
        this.initContactForm();
        this.initQuoteForm();
        this.initApplicationForm();
        this.initSuggestionForm();
        console.log('✅ Form Handler initialized');
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

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            // Collect form data
            const formData = new FormData(form);
            const data = this.collectFormData(formData, formType);

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
            this.showError(form, 'Une erreur est survenue. Veuillez réessayer.');
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

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            const formData = new FormData(form);
            let cvUrl = null;

            // Handle CV upload if file exists
            const cvFile = form.querySelector('#candidate-cv')?.files[0];
            if (cvFile) {
                cvUrl = await this.uploadFile(cvFile, 'cv');
            }

            // Prepare data
            const data = {
                form_type: 'application',
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message'),
                job_id: formData.get('position'),
                metadata: {
                    cv_url: cvUrl,
                    position: formData.get('position')
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

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            const formData = new FormData(form);
            let imageUrl = null;

            // Handle image upload if file exists
            const imageFile = form.querySelector('#outfit-image')?.files[0];
            if (imageFile) {
                imageUrl = await this.uploadFile(imageFile, 'suggestions');
            }

            // Prepare data
            const data = {
                form_type: 'suggestion',
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message'),
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
            this.showError(form, 'Une erreur est survenue lors de l\'envoi de votre suggestion.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Upload file to Supabase Storage
     */
    async uploadFile(file, bucket) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${bucket}/${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('uploads')
            .upload(filePath, file);

        if (error) {
            console.error('File upload error:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('uploads')
            .getPublicUrl(filePath);

        return urlData?.publicUrl || null;
    },

    /**
     * Collect form data based on form type
     */
    collectFormData(formData, formType) {
        const baseData = {
            form_type: formType,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || null,
            message: formData.get('message') || formData.get('details') || null
        };

        switch (formType) {
            case 'contact':
                return {
                    ...baseData,
                    subject: formData.get('subject') || null
                };

            case 'quote':
                return {
                    ...baseData,
                    company: formData.get('company') || null,
                    product_interest: formData.get('category') || null,
                    quantity: formData.get('quantity') || null,
                    metadata: {
                        request_type: formData.get('request_type'),
                        address: formData.get('address'),
                        product: formData.get('product'),
                        deadline: formData.get('deadline'),
                        customization: formData.getAll('customization[]'),
                        budget: formData.get('budget'),
                        source: formData.get('source'),
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

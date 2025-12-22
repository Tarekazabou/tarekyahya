/* ================================================
   PRIMAVET - Website JavaScript
   Main functionality and interactivity
   ================================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initSlider();
    initFormValidation();
    initScrollAnimations();
    initModal();
    initProductFilter();
    initFileUpload();
});

/* ------------------------------------------------
   Navigation Module
   ------------------------------------------------ */
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Header scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

/* ------------------------------------------------
   Hero Slider Module
   ------------------------------------------------ */
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    
    if (slides.length === 0) return;

    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (dots[i]) dots[i].classList.remove('active');
        });
        
        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Auto-play slides
    let autoPlay = setInterval(nextSlide, slideInterval);

    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            clearInterval(autoPlay);
            currentSlide = index;
            showSlide(currentSlide);
            autoPlay = setInterval(nextSlide, slideInterval);
        });
    });

    // Initialize first slide
    showSlide(0);
}

/* ------------------------------------------------
   Form Validation Module
   ------------------------------------------------ */
function initFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            let isValid = true;
            const errors = [];

            // Clear previous errors
            form.querySelectorAll('.error-message').forEach(el => el.remove());
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('has-error');
            });

            // Validate required fields
            form.querySelectorAll('[required]').forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    showFieldError(field, 'Ce champ est requis');
                }
            });

            // Validate email fields
            form.querySelectorAll('input[type="email"]').forEach(field => {
                if (field.value && !isValidEmail(field.value)) {
                    isValid = false;
                    showFieldError(field, 'Veuillez entrer une adresse e-mail valide');
                }
            });

            // Validate phone fields
            form.querySelectorAll('input[type="tel"]').forEach(field => {
                if (field.value && !isValidPhone(field.value)) {
                    isValid = false;
                    showFieldError(field, 'Veuillez entrer un numéro de téléphone valide');
                }
            });

            if (isValid) {
                // Show success message
                showFormSuccess(form);
                form.reset();
            }
        });
    });

    function showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
            const errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            errorEl.textContent = message;
            errorEl.style.color = 'var(--error)';
            errorEl.style.fontSize = '0.875rem';
            errorEl.style.marginTop = '0.25rem';
            formGroup.appendChild(errorEl);
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
        return phoneRegex.test(phone);
    }

    function showFormSuccess(form) {
        const successMessage = document.createElement('div');
        successMessage.className = 'form-success';
        successMessage.innerHTML = `
            <div style="background: var(--success); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;">
                <strong>✓ Message envoyé avec succès!</strong><br>
                Nous vous répondrons dans les plus brefs délais.
            </div>
        `;
        form.insertBefore(successMessage, form.firstChild);
        
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }
}

/* ------------------------------------------------
   Scroll Animations Module
   ------------------------------------------------ */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

/* ------------------------------------------------
   Modal Module
   ------------------------------------------------ */
function initModal() {
    const modal = document.querySelector('.modal');
    const modalContent = document.querySelector('.modal-content');
    const modalClose = document.querySelector('.modal-close');
    const showroomItems = document.querySelectorAll('.showroom-item');

    if (!modal || showroomItems.length === 0) return;

    showroomItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                modalContent.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* ------------------------------------------------
   Product Filter Module
   ------------------------------------------------ */
function initProductFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    if (filterBtns.length === 0 || productCards.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            // Filter products
            productCards.forEach(card => {
                const category = card.dataset.category;
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ------------------------------------------------
   File Upload Module
   ------------------------------------------------ */
function initFileUpload() {
    const fileUploads = document.querySelectorAll('.file-upload');

    fileUploads.forEach(upload => {
        const input = upload.querySelector('input[type="file"]');
        const label = upload.querySelector('p');
        const originalText = label ? label.textContent : '';

        upload.addEventListener('click', () => {
            if (input) input.click();
        });

        if (input) {
            input.addEventListener('change', function() {
                if (this.files.length > 0) {
                    const fileName = this.files[0].name;
                    if (label) {
                        label.innerHTML = `<strong>Fichier sélectionné:</strong> ${fileName}`;
                    }
                    upload.style.borderColor = 'var(--success)';
                } else {
                    if (label) label.textContent = originalText;
                    upload.style.borderColor = '';
                }
            });
        }

        // Drag and drop
        upload.addEventListener('dragover', (e) => {
            e.preventDefault();
            upload.style.borderColor = 'var(--primary-color)';
            upload.style.backgroundColor = 'var(--light-gray)';
        });

        upload.addEventListener('dragleave', () => {
            upload.style.borderColor = '';
            upload.style.backgroundColor = '';
        });

        upload.addEventListener('drop', (e) => {
            e.preventDefault();
            upload.style.borderColor = '';
            upload.style.backgroundColor = '';
            
            if (input && e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                const event = new Event('change');
                input.dispatchEvent(event);
            }
        });
    });
}

/* ------------------------------------------------
   Utility Functions
   ------------------------------------------------ */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format phone number
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    input.value = value;
}

// Counter animation for statistics
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Back to top button
window.addEventListener('scroll', throttle(() => {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }
}, 100));

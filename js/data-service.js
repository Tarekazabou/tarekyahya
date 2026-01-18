/**
 * Data Service Layer
 * Handles all data fetching from Supabase for the Primavet website
 */

// Default values constants
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
const DEFAULT_PRODUCT_ICON = 'fa-tshirt';
const DEFAULT_SHOWROOM_ICON = 'fa-image';

const DataService = {
    // Cache to avoid repeated fetches
    cache: {},
    cacheExpiry: 5 * 60 * 1000, // 5 minutes

    /**
     * Get cached data or fetch fresh
     */
    async getCached(key, fetchFn) {
        const cached = this.cache[key];
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        const data = await fetchFn();
        this.cache[key] = { data, timestamp: Date.now() };
        return data;
    },

    /**
     * Clear cache
     */
    clearCache() {
        this.cache = {};
    },

    // ==================== SITE CONFIG ====================

    /**
     * Get site configuration (contact info, etc.)
     */
    async getSiteConfig() {
        return this.getCached('siteConfig', async () => {
            const { data, error } = await supabaseClient
                .from('site_config')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching site config:', error);
                return this.getDefaultSiteConfig();
            }
            return data;
        });
    },

    getDefaultSiteConfig() {
        return {
            company_name: 'Primavet',
            address: '123 Avenue du Prêt à Porter, 75001 Paris, France',
            phone: '+33 1 23 45 67 89',
            email: 'contact@primavet.com',
            business_hours: 'Lun - Ven: 9h00 - 18h00',
            social_links: {
                facebook: '#',
                instagram: '#',
                linkedin: '#'
            }
        };
    },

    // ==================== PRODUCTS ====================

    /**
     * Get all products
     */
    async getProducts(category = null) {
        const cacheKey = `products_${category || 'all'}`;
        return this.getCached(cacheKey, async () => {
            let query = supabaseClient
                .from('products')
                .select('*')
                .order('sort_order', { ascending: true });

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching products:', error);
                return [];
            }
            return data || [];
        });
    },

    /**
     * Get products with pagination and search
     */
    async getProductsPaginated(page = 1, perPage = 9, category = null, searchTerm = null) {
        const offset = (page - 1) * perPage;
        
        let query = supabaseClient
            .from('products')
            .select('*', { count: 'exact' })
            .order('sort_order', { ascending: true })
            .range(offset, offset + perPage - 1);

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching paginated products:', error);
            return { data: [], count: 0, totalPages: 0 };
        }

        return {
            data: data || [],
            count: count || 0,
            totalPages: Math.ceil((count || 0) / perPage),
            currentPage: page,
            perPage: perPage
        };
    },

    /**
     * Get featured products for homepage
     */
    async getFeaturedProducts(limit = 3) {
        return this.getCached('featuredProducts', async () => {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .eq('is_featured', true)
                .order('sort_order', { ascending: true })
                .limit(limit);

            if (error) {
                console.error('Error fetching featured products:', error);
                return [];
            }
            return data || [];
        });
    },

    // ==================== NEWS ====================

    /**
     * Get all news articles
     */
    async getNews(limit = null) {
        const cacheKey = `news_${limit || 'all'}`;
        return this.getCached(cacheKey, async () => {
            let query = supabaseClient
                .from('news')
                .select('*')
                .order('published_at', { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching news:', error);
                return [];
            }
            return data || [];
        });
    },

    /**
     * Get news with pagination
     */
    async getNewsPaginated(page = 1, perPage = 6, searchTerm = null) {
        const offset = (page - 1) * perPage;
        
        let query = supabaseClient
            .from('news')
            .select('*', { count: 'exact' })
            .order('published_at', { ascending: false })
            .range(offset, offset + perPage - 1);

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching paginated news:', error);
            return { data: [], count: 0, totalPages: 0 };
        }

        return {
            data: data || [],
            count: count || 0,
            totalPages: Math.ceil((count || 0) / perPage),
            currentPage: page,
            perPage: perPage
        };
    },

    /**
     * Get featured news for homepage
     */
    async getFeaturedNews(limit = 3) {
        return this.getCached('featuredNews', async () => {
            const { data, error } = await supabaseClient
                .from('news')
                .select('*')
                .eq('is_featured', true)
                .order('published_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching featured news:', error);
                return [];
            }
            return data || [];
        });
    },

    // ==================== JOBS ====================

    /**
     * Get active job listings
     */
    async getJobs() {
        return this.getCached('jobs', async () => {
            const { data, error } = await supabaseClient
                .from('jobs')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching jobs:', error);
                return [];
            }
            return data || [];
        });
    },

    /**
     * Get all jobs (including inactive) for admin
     */
    async getAllJobs() {
        const { data, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all jobs:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get total jobs count
     */
    async getJobsCount() {
        const { data, error } = await supabaseClient
            .from('jobs')
            .select('id');

        if (error) {
            console.error('Error fetching jobs count:', error);
            return 0;
        }
        return data?.length || 0;
    },

    // ==================== SHOWROOM ====================

    /**
     * Get showroom items
     */
    async getShowroomItems(category = null) {
        const cacheKey = `showroom_${category || 'all'}`;
        return this.getCached(cacheKey, async () => {
            let query = supabaseClient
                .from('showroom_items')
                .select('*')
                .order('sort_order', { ascending: true });

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching showroom items:', error);
                return [];
            }
            return data || [];
        });
    },

    // ==================== STATISTICS ====================

    /**
     * Get statistics by section
     */
    async getStats(section = null) {
        const cacheKey = `stats_${section || 'all'}`;
        return this.getCached(cacheKey, async () => {
            let query = supabaseClient
                .from('stats')
                .select('*')
                .order('sort_order', { ascending: true });

            if (section) {
                query = query.eq('section', section);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching stats:', error);
                return [];
            }
            return data || [];
        });
    },

    /**
     * Get a single stat by key
     */
    async getStat(key) {
        const { data, error } = await supabaseClient
            .from('stats')
            .select('*')
            .eq('key', key)
            .single();

        if (error) {
            console.error('Error fetching stat:', error);
            return null;
        }
        return data;
    },

    // ==================== CLIENTS (Admin) ====================

    /**
     * Get all clients
     */
    async getClients() {
        return this.getCached('clients', async () => {
            const { data, error } = await supabaseClient
                .from('clients')
                .select('*')
                .order('order_count', { ascending: false });

            if (error) {
                console.error('Error fetching clients:', error);
                return [];
            }
            return data || [];
        });
    },

    /**
     * Get top clients
     */
    async getTopClients(limit = 5) {
        return this.getCached('topClients', async () => {
            const { data, error } = await supabaseClient
                .from('clients')
                .select('*')
                .order('order_count', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching top clients:', error);
                return [];
            }
            return data || [];
        });
    },

    /**
     * Get client statistics
     */
    async getClientStats() {
        const clients = await this.getClients();
        const total = clients.length;
        const active = clients.filter(c => c.status === 'active').length;
        const vip = clients.filter(c => c.is_vip).length;
        const inactive = clients.filter(c => c.status === 'inactive').length;

        return {
            total,
            active,
            vip,
            inactive,
            activePercent: total > 0 ? Math.round((active / total) * 100) : 0,
            vipPercent: total > 0 ? Math.round((vip / total) * 100) : 0,
            inactivePercent: total > 0 ? Math.round((inactive / total) * 100) : 0
        };
    },

    // ==================== ADMIN CRUD OPERATIONS ====================

    // ----- NEWS CRUD -----

    /**
     * Create a new news article
     */
    async createNews(newsData) {
        const { data, error } = await supabaseClient
            .from('news')
            .insert([{
                title: newsData.title,
                content: newsData.content,
                excerpt: newsData.excerpt || newsData.content?.substring(0, 200) + '...',
                category: newsData.category,
                author: newsData.author || 'Admin',
                icon: newsData.icon || 'fa-newspaper',
                gradient: newsData.gradient || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                published_at: newsData.published_at || new Date().toISOString().split('T')[0],
                is_featured: newsData.is_featured || false
            }])
            .select();

        if (error) {
            console.error('Error creating news:', error);
            throw error;
        }

        // Clear news cache
        delete this.cache['news_all'];
        delete this.cache['featuredNews'];

        return data[0];
    },

    /**
     * Update a news article
     */
    async updateNews(id, newsData) {
        const { data, error } = await supabaseClient
            .from('news')
            .update(newsData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating news:', error);
            throw error;
        }

        // Clear news cache
        this.clearCache();

        return data[0];
    },

    /**
     * Delete a news article
     */
    async deleteNews(id) {
        const { error } = await supabaseClient
            .from('news')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting news:', error);
            throw error;
        }

        // Clear news cache
        delete this.cache['news_all'];
        delete this.cache['featuredNews'];

        return true;
    },

    // ----- JOBS CRUD -----

    /**
     * Create a new job listing
     */
    async createJob(jobData) {
        const { data, error } = await supabaseClient
            .from('jobs')
            .insert([{
                title: jobData.title,
                location: jobData.location,
                contract_type: jobData.contract_type,
                experience: jobData.experience,
                description: jobData.description,
                is_active: jobData.is_active !== undefined ? jobData.is_active : true
            }])
            .select();

        if (error) {
            console.error('Error creating job:', error);
            throw error;
        }

        // Clear jobs cache
        delete this.cache['jobs'];

        return data[0];
    },

    /**
     * Update a job listing
     */
    async updateJob(id, jobData) {
        const { data, error } = await supabaseClient
            .from('jobs')
            .update(jobData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating job:', error);
            throw error;
        }

        // Clear jobs cache
        delete this.cache['jobs'];

        return data[0];
    },

    /**
     * Delete a job listing
     */
    async deleteJob(id) {
        const { error } = await supabaseClient
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting job:', error);
            throw error;
        }

        // Clear jobs cache
        delete this.cache['jobs'];

        return true;
    },

    /**
     * Toggle job active status
     */
    async toggleJobActive(id, isActive) {
        return this.updateJob(id, { is_active: isActive });
    },

    // ----- PRODUCTS CRUD -----

    /**
     * Create a new product
     */
    async createProduct(productData) {
        const { data, error } = await supabaseClient
            .from('products')
            .insert([{
                name: productData.name,
                description: productData.description,
                category: productData.category,
                badge: productData.badge || null,
                icon: productData.icon || DEFAULT_PRODUCT_ICON,
                gradient: productData.gradient || DEFAULT_GRADIENT,
                is_featured: productData.is_featured || false,
                sort_order: productData.sort_order || 0
            }])
            .select();

        if (error) {
            console.error('Error creating product:', error);
            throw error;
        }

        // Clear products cache
        delete this.cache['products_all'];
        delete this.cache['featuredProducts'];

        return data[0];
    },

    /**
     * Update a product
     */
    async updateProduct(id, productData) {
        const { data, error } = await supabaseClient
            .from('products')
            .update(productData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating product:', error);
            throw error;
        }

        // Clear products cache
        delete this.cache['products_all'];
        delete this.cache['featuredProducts'];

        return data[0];
    },

    /**
     * Delete a product
     */
    async deleteProduct(id) {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            throw error;
        }

        // Clear products cache
        delete this.cache['products_all'];
        delete this.cache['featuredProducts'];

        return true;
    },

    // ----- SHOWROOM CRUD -----

    /**
     * Create a new showroom item
     */
    async createShowroomItem(itemData) {
        const { data, error } = await supabaseClient
            .from('showroom_items')
            .insert([{
                title: itemData.title,
                description: itemData.description || null,
                category: itemData.category || 'collection',
                icon: itemData.icon || DEFAULT_SHOWROOM_ICON,
                gradient: itemData.gradient || DEFAULT_GRADIENT,
                sort_order: itemData.sort_order || 0
            }])
            .select();

        if (error) {
            console.error('Error creating showroom item:', error);
            throw error;
        }

        // Clear showroom cache
        delete this.cache['showroom_all'];

        return data[0];
    },

    /**
     * Update a showroom item
     */
    async updateShowroomItem(id, itemData) {
        const { data, error } = await supabaseClient
            .from('showroom_items')
            .update(itemData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating showroom item:', error);
            throw error;
        }

        // Clear showroom cache
        delete this.cache['showroom_all'];

        return data[0];
    },

    /**
     * Delete a showroom item
     */
    async deleteShowroomItem(id) {
        const { error } = await supabaseClient
            .from('showroom_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting showroom item:', error);
            throw error;
        }

        // Clear showroom cache
        delete this.cache['showroom_all'];

        return true;
    },

    // ----- MESSAGES CRUD -----

    /**
     * Get all messages with optional filters
     */
    async getMessages(filter = 'all') {
        let query = supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter === 'unread') {
            query = query.eq('status', 'unread');
        } else if (filter !== 'all') {
            query = query.eq('form_type', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        // Sanitize metadata for messages: remove obsolete 'source' key if present
        if (Array.isArray(data)) {
            data.forEach(msg => {
                if (msg && msg.metadata && Object.prototype.hasOwnProperty.call(msg.metadata, 'source')) {
                    const copy = { ...msg.metadata };
                    delete copy.source;
                    msg.metadata = copy;
                }
            });
        }

        return data || [];
    },

    /**
     * Get a single message by ID
     */
    async getMessage(id) {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching message:', error);
            throw error;
        }

        // Remove obsolete 'source' key from metadata if present
        if (data && data.metadata && Object.prototype.hasOwnProperty.call(data.metadata, 'source')) {
            const copy = { ...data.metadata };
            delete copy.source;
            data.metadata = copy;
        }

        return data;
    },

    /**
     * Mark message as read
     */
    async markMessageAsRead(id) {
        const { data, error } = await supabaseClient
            .from('messages')
            .update({ status: 'read' })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }

        return data[0];
    },

    /**
     * Delete a message
     */
    async deleteMessage(id) {
        const { error } = await supabaseClient
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting message:', error);
            throw error;
        }

        return true;
    },

    // ==================== VISITOR TRACKING ====================

    /**
     * Get detailed visitor statistics using exact SQL queries
     */
    async getDetailedVisitorStats() {
        try {
            // Total unique visitors: count(distinct visitor_id)
            const { data: allVisitors, error: visitorsError } = await supabaseClient
                .from('page_views')
                .select('visitor_id');
            
            const totalVisitors = allVisitors ? [...new Set(allVisitors.map(v => v.visitor_id))].length : 0;

            // Visitors today: count(distinct visitor_id) where created_at >= current_date
            const today = new Date().toISOString().split('T')[0];
            const { data: todayVisitorsData } = await supabaseClient
                .from('page_views')
                .select('visitor_id')
                .gte('created_at', today);
            
            const visitorsToday = todayVisitorsData ? [...new Set(todayVisitorsData.map(v => v.visitor_id))].length : 0;

            // New visitors: count(distinct visitor_id) where is_new_visitor = true
            const { data: newVisitorsData } = await supabaseClient
                .from('page_views')
                .select('visitor_id')
                .eq('is_new_visitor', true);
            
            const newVisitors = newVisitorsData ? [...new Set(newVisitorsData.map(v => v.visitor_id))].length : 0;

            // Sessions: count(distinct session_id)
            const { data: allSessions } = await supabaseClient
                .from('page_views')
                .select('session_id');
            
            const totalSessions = allSessions ? [...new Set(allSessions.filter(s => s.session_id).map(s => s.session_id))].length : 0;

            // Page views: count(*)
            const { count: totalPageViews } = await supabaseClient
                .from('page_views')
                .select('*', { count: 'exact', head: true });

            return {
                totalVisitors,
                visitorsToday,
                newVisitors,
                returningVisitors: totalVisitors - newVisitors,
                totalSessions,
                totalPageViews: totalPageViews || 0,
                avgPagesPerSession: totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Error fetching detailed visitor stats:', error);
            return {
                totalVisitors: 0,
                visitorsToday: 0,
                newVisitors: 0,
                returningVisitors: 0,
                totalSessions: 0,
                totalPageViews: 0,
                avgPagesPerSession: 0
            };
        }
    },

    /**
     * Get visitor statistics for dashboard
     */
    async getVisitorStats() {
        return this.getCached('visitorStats', async () => {
            try {
                // Get today's date and dates for comparison
                const today = new Date().toISOString().split('T')[0];
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                // Get total page views
                const { count: totalViews, error: viewsError } = await supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true });

                // Get unique visitors (distinct visitor_id)
                const { data: uniqueData, error: uniqueError } = await supabaseClient
                    .from('page_views')
                    .select('visitor_id');

                const uniqueVisitors = uniqueData ? [...new Set(uniqueData.map(v => v.visitor_id))].length : 0;

                // Get today's views
                const { count: todayViews, error: todayError } = await supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', today);

                // Get last 7 days views
                const { count: weekViews, error: weekError } = await supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', sevenDaysAgo);

                // Get last 30 days views
                const { count: monthViews, error: monthError } = await supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', thirtyDaysAgo);

                // Get new visitors count
                const { data: newVisitorsData } = await supabaseClient
                    .from('page_views')
                    .select('visitor_id')
                    .eq('is_new_visitor', true);

                const newVisitors = newVisitorsData ? [...new Set(newVisitorsData.map(v => v.visitor_id))].length : 0;

                // Get mobile vs desktop
                const { count: mobileCount } = await supabaseClient
                    .from('page_views')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_mobile', true);

                return {
                    totalViews: totalViews || 0,
                    uniqueVisitors: uniqueVisitors,
                    todayViews: todayViews || 0,
                    weekViews: weekViews || 0,
                    monthViews: monthViews || 0,
                    newVisitors: newVisitors,
                    returningVisitors: uniqueVisitors - newVisitors,
                    mobileVisitors: mobileCount || 0,
                    desktopVisitors: (totalViews || 0) - (mobileCount || 0)
                };
            } catch (error) {
                console.error('Error fetching visitor stats:', error);
                return {
                    totalViews: 0,
                    uniqueVisitors: 0,
                    todayViews: 0,
                    weekViews: 0,
                    monthViews: 0,
                    newVisitors: 0,
                    returningVisitors: 0,
                    mobileVisitors: 0,
                    desktopVisitors: 0
                };
            }
        });
    },

    /**
     * Get page views grouped by page
     */
    async getTopPages(limit = 10) {
        try {
            const { data, error } = await supabaseClient
                .from('page_views')
                .select('page_url, page_title');

            if (error) throw error;

            // Group by page_url and count
            const pageCounts = {};
            data.forEach(view => {
                const url = view.page_url;
                if (!pageCounts[url]) {
                    pageCounts[url] = { url, title: view.page_title, count: 0 };
                }
                pageCounts[url].count++;
            });

            // Sort by count and return top pages
            return Object.values(pageCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching top pages:', error);
            return [];
        }
    },

    /**
     * Get page views grouped by day for chart
     */
    async getViewsByDay(days = 30) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

            const { data, error } = await supabaseClient
                .from('page_views')
                .select('created_at')
                .gte('created_at', startDate)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by day
            const dayCounts = {};
            data.forEach(view => {
                const day = view.created_at.split('T')[0];
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            });

            // Fill in missing days with 0
            const result = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dayStr = date.toISOString().split('T')[0];
                result.push({
                    date: dayStr,
                    views: dayCounts[dayStr] || 0
                });
            }

            return result;
        } catch (error) {
            console.error('Error fetching views by day:', error);
            return [];
        }
    },

    /**
     * Get referrer statistics
     */
    async getTopReferrers(limit = 10) {
        try {
            const { data, error } = await supabaseClient
                .from('page_views')
                .select('referrer')
                .not('referrer', 'is', null)
                .not('referrer', 'eq', '');

            if (error) throw error;

            // Group by referrer and count
            const referrerCounts = {};
            data.forEach(view => {
                const ref = view.referrer || 'Direct';
                // Extract domain from referrer
                let domain = 'Direct';
                try {
                    if (ref && ref !== 'Direct') {
                        domain = new URL(ref).hostname;
                    }
                } catch {
                    domain = ref;
                }
                referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
            });

            // Sort by count and return top referrers
            return Object.entries(referrerCounts)
                .map(([source, count]) => ({ source, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching top referrers:', error);
            return [];
        }
    },

    /**
     * Get device statistics
     */
    async getDeviceStats() {
        try {
            const { data, error } = await supabaseClient
                .from('page_views')
                .select('is_mobile, screen_width, screen_height');

            if (error) throw error;

            let mobile = 0;
            let desktop = 0;
            let tablet = 0;

            data.forEach(view => {
                if (view.is_mobile) {
                    if (view.screen_width >= 768) {
                        tablet++;
                    } else {
                        mobile++;
                    }
                } else {
                    desktop++;
                }
            });

            const total = mobile + desktop + tablet;
            return {
                mobile: { count: mobile, percent: total > 0 ? Math.round((mobile / total) * 100) : 0 },
                desktop: { count: desktop, percent: total > 0 ? Math.round((desktop / total) * 100) : 0 },
                tablet: { count: tablet, percent: total > 0 ? Math.round((tablet / total) * 100) : 0 }
            };
        } catch (error) {
            console.error('Error fetching device stats:', error);
            return {
                mobile: { count: 0, percent: 0 },
                desktop: { count: 0, percent: 0 },
                tablet: { count: 0, percent: 0 }
            };
        }
    },

    // ==================== ORDERS STATISTICS ====================

    /**
     * Get order statistics with proper trend calculation
     */
    async getOrderStats() {
        try {
            // Get total orders count
            const { count: totalOrders, error: countError } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                console.warn('Orders count query error:', countError.message);
            }

            // Get current month orders
            const currentMonth = new Date();
            const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
            
            const { count: currentMonthOrders, error: currentError } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', currentMonthStart);

            if (currentError) {
                console.warn('Current month orders query error:', currentError.message);
            }

            // Get previous month orders for trend
            const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const previousMonthStart = previousMonth.toISOString();
            const previousMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
            
            const { count: previousMonthOrders, error: prevError } = await supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', previousMonthStart)
                .lt('created_at', previousMonthEnd);

            if (prevError) {
                console.warn('Previous month orders query error:', prevError.message);
            }

            // Calculate trend percentage
            let trendPercent = 0;
            let trendDirection = 'stable';
            
            if (previousMonthOrders > 0) {
                trendPercent = Math.round(((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100);
                trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'stable';
            } else if (currentMonthOrders > 0) {
                trendPercent = 100;
                trendDirection = 'up';
            }

            // Get total revenue
            const { data: ordersData } = await supabaseClient
                .from('orders')
                .select('total_amount, created_at');

            let totalRevenue = 0;
            let currentMonthRevenue = 0;
            let previousMonthRevenue = 0;

            if (ordersData) {
                ordersData.forEach(order => {
                    const amount = parseFloat(order.total_amount) || 0;
                    totalRevenue += amount;

                    if (order.created_at >= currentMonthStart) {
                        currentMonthRevenue += amount;
                    }
                    if (order.created_at >= previousMonthStart && order.created_at < previousMonthEnd) {
                        previousMonthRevenue += amount;
                    }
                });
            }

            // Calculate revenue trend
            let revenueTrendPercent = 0;
            if (previousMonthRevenue > 0) {
                revenueTrendPercent = Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);
            } else if (currentMonthRevenue > 0) {
                revenueTrendPercent = 100;
            }

            return {
                totalOrders: totalOrders || 0,
                currentMonthOrders: currentMonthOrders || 0,
                previousMonthOrders: previousMonthOrders || 0,
                trendPercent: trendPercent,
                trendDirection: trendDirection,
                trendLabel: `${trendPercent > 0 ? '+' : ''}${trendPercent}%`,
                totalRevenue: totalRevenue,
                currentMonthRevenue: currentMonthRevenue,
                previousMonthRevenue: previousMonthRevenue,
                revenueTrendPercent: revenueTrendPercent,
                revenueTrendLabel: `${revenueTrendPercent > 0 ? '+' : ''}${revenueTrendPercent}%`,
                averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Error fetching order stats:', error);
            return {
                totalOrders: 0,
                currentMonthOrders: 0,
                previousMonthOrders: 0,
                trendPercent: 0,
                trendDirection: 'stable',
                trendLabel: '0%',
                totalRevenue: 0,
                currentMonthRevenue: 0,
                previousMonthRevenue: 0,
                revenueTrendPercent: 0,
                revenueTrendLabel: '0%',
                averageOrderValue: 0
            };
        }
    }
};

// Export for use
window.DataService = DataService;

console.log('✅ Data Service initialized');

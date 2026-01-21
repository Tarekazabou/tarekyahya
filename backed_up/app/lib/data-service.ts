/**
 * Data Service Layer
 * Handles all data fetching from Supabase for the Primavet website
 */

import { supabase } from './supabase';

// Types
export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  gradient: string;
  icon: string;
  badge?: string;
  is_featured: boolean;
  sort_order: number;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  author: string;
  published_at: string;
  gradient: string;
  icon: string;
  is_featured: boolean;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  experience: string;
  is_active: boolean;
}

export interface ShowroomItem {
  id: number;
  title: string;
  description: string;
  category: string;
  gradient: string;
  icon: string;
  sort_order: number;
}

export interface SiteConfig {
  company_name: string;
  address: string;
  phone: string;
  email: string;
  business_hours: string;
  social_links: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

// Cache
const cache: { [key: string]: { data: unknown; timestamp: number } } = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

async function getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data as T;
  }
  const data = await fetchFn();
  cache[key] = { data, timestamp: Date.now() };
  return data;
}

export function clearCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}

// Site Config
export async function getSiteConfig(): Promise<SiteConfig> {
  if (!supabase) return getDefaultSiteConfig();
  
  const client = supabase;
  return getCached('siteConfig', async () => {
    const { data, error } = await client
      .from('site_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching site config:', error);
      return getDefaultSiteConfig();
    }
    return data;
  });
}

function getDefaultSiteConfig(): SiteConfig {
  return {
    company_name: 'Primavet',
    address: 'Rue Saad Ibn Waqas, Kalâa Seghira (4021), Tunisie',
    phone: 'Fixe: 36 110 027 | Mobile: 25 500 780',
    email: 'Societe@primavet.tn',
    business_hours: 'Lun - Ven: 8h00 - 17h00',
    social_links: {
      facebook: '#',
      instagram: '#',
      linkedin: '#'
    }
  };
}

// Products
export async function getProducts(category: string | null = null): Promise<Product[]> {
  if (!supabase) return [];
  
  const client = supabase;
  const cacheKey = `products_${category || 'all'}`;
  return getCached(cacheKey, async () => {
    let query = client
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
}

export async function getProductsPaginated(
  page = 1,
  perPage = 9,
  category: string | null = null,
  searchTerm: string | null = null
): Promise<PaginatedResult<Product>> {
  if (!supabase) return { data: [], count: 0, totalPages: 0, currentPage: page, perPage };
  
  const client = supabase;
  const offset = (page - 1) * perPage;

  let query = client
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
    return { data: [], count: 0, totalPages: 0, currentPage: page, perPage };
  }

  return {
    data: data || [],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
    currentPage: page,
    perPage
  };
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  if (!supabase) return [];
  
  const client = supabase;
  return getCached('featuredProducts', async () => {
    const { data, error } = await client
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
}

// News
export async function getNews(limit: number | null = null): Promise<NewsArticle[]> {
  if (!supabase) return [];
  
  const client = supabase;
  const cacheKey = `news_${limit || 'all'}`;
  return getCached(cacheKey, async () => {
    let query = client
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
}

export async function getNewsPaginated(
  page = 1,
  perPage = 6,
  searchTerm: string | null = null
): Promise<PaginatedResult<NewsArticle>> {
  if (!supabase) return { data: [], count: 0, totalPages: 0, currentPage: page, perPage };
  
  const client = supabase;
  const offset = (page - 1) * perPage;

  let query = client
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
    return { data: [], count: 0, totalPages: 0, currentPage: page, perPage };
  }

  return {
    data: data || [],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
    currentPage: page,
    perPage
  };
}

export async function getFeaturedNews(limit = 3): Promise<NewsArticle[]> {
  if (!supabase) return [];
  
  const client = supabase;
  return getCached('featuredNews', async () => {
    const { data, error } = await client
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
}

// Jobs
export async function getJobs(): Promise<Job[]> {
  if (!supabase) return [];
  
  const client = supabase;
  return getCached('jobs', async () => {
    const { data, error } = await client
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
}

// Showroom
export async function getShowroomItems(category: string | null = null): Promise<ShowroomItem[]> {
  if (!supabase) return [];
  
  const client = supabase;
  const cacheKey = `showroom_${category || 'all'}`;
  return getCached(cacheKey, async () => {
    let query = client
      .from('showroom')
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
}

// Form Submissions
export interface ContactFormData {
  form_type: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  subject?: string | null;
}

export interface QuoteFormData extends ContactFormData {
  company?: string | null;
  product_interest?: string | null;
  quantity?: string | null;
  metadata?: Record<string, unknown>;
}

export async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  
  const client = supabase;
  const { error } = await client
    .from('messages')
    .insert([data]);

  if (error) {
    console.error('Error submitting contact form:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function submitQuoteForm(data: QuoteFormData): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  
  const client = supabase;
  const { error } = await client
    .from('messages')
    .insert([data]);

  if (error) {
    console.error('Error submitting quote form:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

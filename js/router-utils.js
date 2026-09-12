/**
 * Router & URL Utilities
 * Designed for GitHub Pages relative-path compatibility
 * Suttinee Teacher Workspace
 */

import { CONFIG } from './config.js';

export const RouterUtils = {
  /**
   * Get query parameters as an object
   */
  getQueryParams() {
    if (typeof window === 'undefined') return {};
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Get specific query param
   */
  getParam(key, defaultValue = null) {
    const params = this.getQueryParams();
    return params[key] !== undefined ? params[key] : defaultValue;
  },

  /**
   * Resolve current academic year based on priority:
   * 1. URL `year` query parameter
   * 2. localStorage `stw:selected_year`
   * 3. CONFIG.DEFAULT_YEAR
   */
  resolveYear() {
    const urlYear = this.getParam('year');
    if (urlYear && /^\d{4}$/.test(urlYear)) {
      return urlYear;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('stw:selected_year');
      if (stored && /^\d{4}$/.test(stored)) {
        return stored;
      }
    }
    return CONFIG.DEFAULT_YEAR;
  },

  /**
   * Build relative URL for GitHub Pages compatibility
   * @param {string} page - e.g. "classroom.html" or "./classroom.html"
   * @param {Record<string, string|number>} params - query params e.g. { year: "2569" }
   */
  buildUrl(page, params = {}) {
    let cleanPage = page.startsWith('./') ? page.slice(2) : page;
    if (cleanPage.startsWith('/')) cleanPage = cleanPage.slice(1);

    const currentUrl = new URL(window.location.href);
    // Resolve relative to current pathname directory
    const targetUrl = new URL(cleanPage, currentUrl);

    // Set params
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        targetUrl.searchParams.set(k, String(v));
      }
    });

    return targetUrl.href;
  },

  /**
   * Navigate to target page while preserving active academic year
   */
  navigateTo(page, extraParams = {}) {
    const currentYear = this.resolveYear();
    const params = { year: currentYear, ...extraParams };
    window.location.href = this.buildUrl(page, params);
  },

  /**
   * Update URL search params in browser history without page reload
   */
  setQueryParam(key, value) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
    window.history.replaceState({}, '', url.href);
  }
};

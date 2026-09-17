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
   * Find the latest academic year from an array of year objects
   * Looks for year with is_default: true, or the highest numeric year (พ.ศ. ล่าสุด)
   */
  findLatestYear(years) {
    if (!years || !years.length) return CONFIG.DEFAULT_YEAR;
    const def = years.find(y => y.is_default === true || String(y.is_default).toLowerCase() === 'true');
    if (def && def.year) return String(def.year);
    const validYears = years
      .map(y => Number(y.year))
      .filter(n => !isNaN(n) && n > 2500)
      .sort((a, b) => b - a);
    if (validYears.length > 0) return String(validYears[0]);
    return String(years[0].year || CONFIG.DEFAULT_YEAR);
  },

  /**
   * Resolve current academic year based on priority:
   * 1. URL `year` query parameter (user explicitly chose this year)
   * 2. CONFIG.DEFAULT_YEAR (latest active academic year)
   */
  resolveYear() {
    const urlYear = this.getParam('year');
    if (urlYear && /^\d{4}$/.test(urlYear)) {
      return urlYear;
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

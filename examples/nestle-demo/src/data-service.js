import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Data Service - Handles loading mock data or connecting to real systems
 */
export class DataService {
  constructor({ useMockData = true, mockDataPath = null } = {}) {
    this.useMockData = useMockData;
    this.mockDataPath = mockDataPath || path.join(__dirname, '..', 'mock-data');
    this.cache = new Map();
  }

  /**
   * Load store profile
   */
  async getStoreProfile(storeId) {
    const data = await this._loadStoreData(storeId);
    return data?.profile || null;
  }

  /**
   * Load Exceedra visit history
   */
  async getExceedraVisits(storeId, count = 3) {
    const data = await this._loadStoreData(storeId);
    return (data?.exceedraVisits || []).slice(0, count);
  }

  /**
   * Load SAP sales data
   */
  async getSAPSalesData(storeId, period = '90 days') {
    const data = await this._loadStoreData(storeId);
    return data?.sapSales || null;
  }

  /**
   * Load Power BI dashboard data
   */
  async getPowerBIDashboard(storeId, period = '12 months') {
    const data = await this._loadStoreData(storeId);
    return data?.powerBIDashboard || null;
  }

  /**
   * Load similar store success cases
   */
  async getSimilarStoreSuccesses(storeId) {
    const data = await this._loadStoreData(storeId);
    return data?.similarStoreSuccesses || [];
  }

  /**
   * Load competitor intelligence
   */
  async getCompetitorIntel(storeId) {
    const data = await this._loadStoreData(storeId);
    return data?.competitorIntel || [];
  }

  /**
   * Get product catalog
   */
  async getProducts() {
    return this._loadJSON('products.json');
  }

  /**
   * Get campaign library
   */
  async getCampaigns() {
    return this._loadJSON('campaigns.json');
  }

  /**
   * Get all stores
   */
  async getAllStores() {
    return this._loadJSON('stores.json');
  }

  /**
   * Internal: Load complete store data bundle
   */
  async _loadStoreData(storeId) {
    const cacheKey = `store-${storeId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.useMockData) {
      const data = await this._loadJSON(`store-${storeId}.json`);
      this.cache.set(cacheKey, data);
      return data;
    }

    // TODO: Implement real data source connections
    throw new Error('Real data source integration not yet implemented');
  }

  /**
   * Internal: Load JSON file
   */
  async _loadJSON(filename) {
    try {
      const filePath = path.join(this.mockDataPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Failed to load ${filename}:`, err.message);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}
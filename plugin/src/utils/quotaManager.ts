/**
 * Quota management for Google Sheets API and Figma plugin performance
 */

import { logToUI } from "./ui";
import { retryOperation } from "./errorHandler";

interface QuotaLimits {
  // Google Sheets API limits per minute
  sheetsReadRequests: number;
  sheetsWriteRequests: number;
  // Figma plugin limits
  figmaOperationsPerSecond: number;
  maxMemoryUsage: number; // in MB
}

interface QuotaTracker {
  sheetsReads: { timestamp: number; count: number }[];
  sheetsWrites: { timestamp: number; count: number }[];
  figmaOperations: { timestamp: number; count: number }[];
  memoryUsage: number;
}

class QuotaManager {
  private static instance: QuotaManager;
  private limits: QuotaLimits;
  private tracker: QuotaTracker;
  private startTime: number;

  constructor() {
    this.limits = {
      sheetsReadRequests: 100, // Conservative limit for reads per minute
      sheetsWriteRequests: 100, // Conservative limit for writes per minute
      figmaOperationsPerSecond: 50, // Conservative Figma operation limit
      maxMemoryUsage: 100, // 100MB limit for plugin
    };

    this.tracker = {
      sheetsReads: [],
      sheetsWrites: [],
      figmaOperations: [],
      memoryUsage: 0,
    };

    this.startTime = Date.now();
  }

  static getInstance(): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager();
    }
    return QuotaManager.instance;
  }

  /**
   * Clean old entries from tracker (older than 1 minute)
   */
  private cleanOldEntries(entries: { timestamp: number; count: number }[]): void {
    const oneMinuteAgo = Date.now() - 60000;
    const index = entries.findIndex(entry => entry.timestamp > oneMinuteAgo);
    if (index > 0) {
      entries.splice(0, index);
    }
  }

  /**
   * Get current usage for a specific quota type
   */
  private getCurrentUsage(entries: { timestamp: number; count: number }[]): number {
    this.cleanOldEntries(entries);
    return entries.reduce((total, entry) => total + entry.count, 0);
  }

  /**
   * Check if we can make more requests without hitting quota
   */
  canMakeRequest(type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation', count: number = 1): boolean {
    switch (type) {
      case 'sheetsRead':
        return this.getCurrentUsage(this.tracker.sheetsReads) + count <= this.limits.sheetsReadRequests;
      case 'sheetsWrite':
        return this.getCurrentUsage(this.tracker.sheetsWrites) + count <= this.limits.sheetsWriteRequests;
      case 'figmaOperation':
        const oneSecondAgo = Date.now() - 1000;
        const recentOps = this.tracker.figmaOperations.filter(entry => entry.timestamp > oneSecondAgo);
        const currentOpsPerSecond = recentOps.reduce((total, entry) => total + entry.count, 0);
        return currentOpsPerSecond + count <= this.limits.figmaOperationsPerSecond;
      default:
        return false;
    }
  }

  /**
   * Record a request to track quota usage
   */
  recordRequest(type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation', count: number = 1): void {
    const timestamp = Date.now();
    
    switch (type) {
      case 'sheetsRead':
        this.tracker.sheetsReads.push({ timestamp, count });
        break;
      case 'sheetsWrite':
        this.tracker.sheetsWrites.push({ timestamp, count });
        break;
      case 'figmaOperation':
        this.tracker.figmaOperations.push({ timestamp, count });
        break;
    }
  }

  /**
   * Calculate optimal delay to avoid quota limits
   */
  getOptimalDelay(type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation'): number {
    if (this.canMakeRequest(type)) {
      return 0;
    }

    switch (type) {
      case 'sheetsRead':
      case 'sheetsWrite':
        // If quota is full, wait until oldest entry expires
        const entries = type === 'sheetsRead' ? this.tracker.sheetsReads : this.tracker.sheetsWrites;
        if (entries.length > 0) {
          const oldestEntry = entries[0];
          return Math.max(0, (oldestEntry.timestamp + 60000) - Date.now() + 1000); // Add 1s buffer
        }
        return 60000; // Default 1 minute wait
      case 'figmaOperation':
        return 1000; // Wait 1 second for Figma operations
      default:
        return 1000;
    }
  }

  /**
   * Calculate optimal batch size based on current quota usage
   */
  getOptimalBatchSize(type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation', maxBatchSize: number): number {
    const remaining = this.getRemainingQuota(type);
    return Math.min(maxBatchSize, Math.max(1, remaining));
  }

  /**
   * Get remaining quota for current time window
   */
  getRemainingQuota(type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation'): number {
    switch (type) {
      case 'sheetsRead':
        return this.limits.sheetsReadRequests - this.getCurrentUsage(this.tracker.sheetsReads);
      case 'sheetsWrite':
        return this.limits.sheetsWriteRequests - this.getCurrentUsage(this.tracker.sheetsWrites);
      case 'figmaOperation':
        const oneSecondAgo = Date.now() - 1000;
        const recentOps = this.tracker.figmaOperations.filter(entry => entry.timestamp > oneSecondAgo);
        const currentOpsPerSecond = recentOps.reduce((total, entry) => total + entry.count, 0);
        return this.limits.figmaOperationsPerSecond - currentOpsPerSecond;
      default:
        return 0;
    }
  }

  /**
   * Wait for quota to be available
   */
  async waitForQuota(type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation', count: number = 1): Promise<void> {
    if (this.canMakeRequest(type, count)) {
      return;
    }

    const delay = this.getOptimalDelay(type);
    logToUI(`Quota limit reached for ${type}, waiting ${Math.round(delay / 1000)}s...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Recursive check in case we still don't have quota
    if (!this.canMakeRequest(type, count)) {
      await this.waitForQuota(type, count);
    }
  }

  /**
   * Execute operation with quota management
   */
  async executeWithQuota<T>(
    operation: () => Promise<T>,
    type: 'sheetsRead' | 'sheetsWrite' | 'figmaOperation',
    count: number = 1
  ): Promise<T> {
    await this.waitForQuota(type, count);
    
    const result = await retryOperation(operation, 3, 1000);
    this.recordRequest(type, count);
    
    return result;
  }

  /**
   * Get quota status for logging
   */
  getQuotaStatus(): string {
    const sheetsReads = this.getCurrentUsage(this.tracker.sheetsReads);
    const sheetsWrites = this.getCurrentUsage(this.tracker.sheetsWrites);
    const figmaOps = this.getRemainingQuota('figmaOperation');
    
    return `Quota Status - Sheets Reads: ${sheetsReads}/${this.limits.sheetsReadRequests}, ` +
           `Writes: ${sheetsWrites}/${this.limits.sheetsWriteRequests}, ` +
           `Figma Ops: ${figmaOps}/${this.limits.figmaOperationsPerSecond}/s`;
  }

  /**
   * Update memory usage tracking
   */
  updateMemoryUsage(usage: number): void {
    this.tracker.memoryUsage = usage;
    if (usage > this.limits.maxMemoryUsage) {
      logToUI(`Warning: Memory usage (${usage}MB) exceeds limit (${this.limits.maxMemoryUsage}MB)`);
    }
  }

  /**
   * Check if memory usage is within limits
   */
  isMemoryWithinLimits(): boolean {
    return this.tracker.memoryUsage <= this.limits.maxMemoryUsage;
  }

  /**
   * Reset all quota tracking (useful for new operations)
   */
  reset(): void {
    this.tracker = {
      sheetsReads: [],
      sheetsWrites: [],
      figmaOperations: [],
      memoryUsage: 0,
    };
    this.startTime = Date.now();
    logToUI("Quota tracking reset");
  }
}

export const quotaManager = QuotaManager.getInstance();

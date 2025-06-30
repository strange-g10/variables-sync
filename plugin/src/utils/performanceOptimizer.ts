/**
 * Performance optimizer for adaptive processing based on data size
 */

import { logToUI, updateProgress, ProgressData } from "./ui";
import { quotaManager } from "./quotaManager";

export interface ProcessingConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxConcurrency: number;
  enableCaching: boolean;
  compressionThreshold: number;
}

export interface DataSizeMetrics {
  itemCount: number;
  estimatedMemoryUsage: number; // in MB
  complexity: 'low' | 'medium' | 'high';
  processingTime: 'fast' | 'medium' | 'slow';
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, any> = new Map();
  private processingStats: Map<string, { startTime: number; endTime?: number; itemsProcessed: number }> = new Map();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Analyze data size and complexity to determine optimal processing strategy
   */
  analyzeDataSize(data: any[]): DataSizeMetrics {
    const itemCount = data.length;
    
    // Estimate memory usage (rough calculation)
    const sampleItem = data[0] || {};
    const itemSizeEstimate = JSON.stringify(sampleItem).length / 1024; // KB per item
    const estimatedMemoryUsage = (itemCount * itemSizeEstimate) / 1024; // MB

    let complexity: 'low' | 'medium' | 'high';
    let processingTime: 'fast' | 'medium' | 'slow';

    if (itemCount <= 100 && estimatedMemoryUsage <= 10) {
      complexity = 'low';
      processingTime = 'fast';
    } else if (itemCount <= 1000 && estimatedMemoryUsage <= 50) {
      complexity = 'medium';
      processingTime = 'medium';
    } else {
      complexity = 'high';
      processingTime = 'slow';
    }

    logToUI(`Data analysis: ${itemCount} items, ~${estimatedMemoryUsage.toFixed(2)}MB, complexity: ${complexity}`);

    return { itemCount, estimatedMemoryUsage, complexity, processingTime };
  }

  /**
   * Get optimal processing configuration based on data metrics
   */
  getOptimalConfig(metrics: DataSizeMetrics, operationType: 'import' | 'export' | 'assign'): ProcessingConfig {
    let config: ProcessingConfig;

    switch (metrics.complexity) {
      case 'low':
        config = {
          batchSize: operationType === 'import' ? 50 : 100,
          delayBetweenBatches: 100,
          maxConcurrency: 5,
          enableCaching: true,
          compressionThreshold: 100,
        };
        break;

      case 'medium':
        config = {
          batchSize: operationType === 'import' ? 25 : 50,
          delayBetweenBatches: 250,
          maxConcurrency: 3,
          enableCaching: true,
          compressionThreshold: 50,
        };
        break;

      case 'high':
        config = {
          batchSize: operationType === 'import' ? 10 : 25,
          delayBetweenBatches: 500,
          maxConcurrency: 2,
          enableCaching: false, // Disable caching for large datasets to save memory
          compressionThreshold: 25,
        };
        break;
    }

    // Adjust based on current quota status
    const quotaStatus = quotaManager.getQuotaStatus();
    const remainingQuota = quotaManager.getRemainingQuota(
      operationType === 'import' ? 'sheetsRead' : 
      operationType === 'export' ? 'sheetsWrite' : 'figmaOperation'
    );

    if (remainingQuota < config.batchSize) {
      config.batchSize = Math.max(1, remainingQuota);
      config.delayBetweenBatches *= 2; // Increase delay when quota is low
      logToUI(`Adjusted batch size to ${config.batchSize} due to quota limits`);
    }

    logToUI(`Optimal config: batch=${config.batchSize}, delay=${config.delayBetweenBatches}ms, concurrency=${config.maxConcurrency}`);
    
    return config;
  }

  /**
   * Process data in adaptive batches with progress tracking
   */
  async processInBatches<T, R>(
    data: T[],
    processor: (batch: T[], batchIndex: number) => Promise<R[]>,
    operationType: 'import' | 'export' | 'assign',
    onProgress?: (progress: ProgressData) => void
  ): Promise<R[]> {
    const metrics = this.analyzeDataSize(data);
    const config = this.getOptimalConfig(metrics, operationType);
    
    const operationId = `${operationType}_${Date.now()}`;
    this.processingStats.set(operationId, {
      startTime: Date.now(),
      itemsProcessed: 0,
    });

    const results: R[] = [];
    const totalBatches = Math.ceil(data.length / config.batchSize);
    let processedItems = 0;

    logToUI(`Starting ${operationType} processing: ${data.length} items in ${totalBatches} batches`);

    for (let i = 0; i < data.length; i += config.batchSize) {
      const batchIndex = Math.floor(i / config.batchSize);
      const batch = data.slice(i, i + config.batchSize);
      
      try {
        // Wait for quota if needed
        const quotaType = operationType === 'import' ? 'sheetsRead' : 
                         operationType === 'export' ? 'sheetsWrite' : 'figmaOperation';
        
        await quotaManager.waitForQuota(quotaType, batch.length);

        // Process batch
        const batchResults = await processor(batch, batchIndex);
        results.push(...batchResults);
        
        processedItems += batch.length;
        
        // Record quota usage
        quotaManager.recordRequest(quotaType, batch.length);

        // Update progress
        const progress: ProgressData = {
          processed: processedItems,
          total: data.length,
          created: 0, // These would be tracked by the processor
          updated: 0,
          aliases: 0,
        };

        if (onProgress) {
          onProgress(progress);
        }

        updateProgress(
          `${operationType}: batch ${batchIndex + 1}/${totalBatches} (${processedItems}/${data.length})`,
          progress
        );

        // Check memory usage
        if (typeof performance !== 'undefined' && (performance as any).memory) {
          const memUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
          quotaManager.updateMemoryUsage(memUsage);
          
          if (!quotaManager.isMemoryWithinLimits()) {
            logToUI("Memory usage high, forcing garbage collection...");
            // Force garbage collection if available
            if ((global as any).gc) {
              (global as any).gc();
            }
          }
        }

        // Delay between batches to prevent overwhelming the system
        if (i + config.batchSize < data.length) {
          const delay = quotaManager.getOptimalDelay(quotaType) || config.delayBetweenBatches;
          if (delay > 0) {
            logToUI(`Waiting ${delay}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logToUI(`Error processing batch ${batchIndex + 1}: ${errorMessage}`);
        
        // Continue with next batch unless it's a critical error
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          logToUI("Quota/rate limit error, waiting longer before retry...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          i -= config.batchSize; // Retry this batch
        }
      }
    }

    // Record completion stats
    const stats = this.processingStats.get(operationId);
    if (stats) {
      stats.endTime = Date.now();
      stats.itemsProcessed = processedItems;
      
      const duration = stats.endTime - stats.startTime;
      const itemsPerSecond = processedItems / (duration / 1000);
      
      logToUI(`${operationType} completed: ${processedItems} items in ${duration}ms (${itemsPerSecond.toFixed(2)} items/sec)`);
    }

    return results;
  }

  /**
   * Cache management for frequently accessed data
   */
  getCachedData<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  setCachedData<T>(key: string, data: T, ttl: number = 300000): void { // 5 min default TTL
    this.cache.set(key, { data, expires: Date.now() + ttl });
    
    // Clean expired entries
    this.cleanExpiredCache();
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires && value.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): { [operationId: string]: any } {
    const stats: { [operationId: string]: any } = {};
    
    for (const [id, stat] of this.processingStats.entries()) {
      stats[id] = {
        ...stat,
        duration: stat.endTime ? stat.endTime - stat.startTime : Date.now() - stat.startTime,
        isComplete: !!stat.endTime,
      };
    }
    
    return stats;
  }

  /**
   * Clear all caches and stats (useful for memory cleanup)
   */
  reset(): void {
    this.cache.clear();
    this.processingStats.clear();
    logToUI("Performance optimizer reset");
  }

  /**
   * Estimate completion time based on current progress
   */
  estimateCompletion(operationId: string, currentProgress: number, totalItems: number): number {
    const stats = this.processingStats.get(operationId);
    if (!stats || currentProgress === 0) return 0;

    const elapsed = Date.now() - stats.startTime;
    const rate = currentProgress / elapsed; // items per ms
    const remaining = totalItems - currentProgress;
    
    return remaining / rate; // estimated remaining time in ms
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();

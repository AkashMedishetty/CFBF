/**
 * Advanced Background Sync and Queue Management
 * Priority-based background sync with intelligent conflict resolution
 */

import logger from './logger';
import security from './security';

class BackgroundSyncManager {
  constructor() {
    this.syncQueues = new Map();
    this.syncStrategies = new Map();
    this.conflictResolvers = new Map();
    this.retryPolicies = new Map();
    this.syncStatus = new Map();
    this.isOnline = navigator.onLine;
    this.serviceWorkerRegistration = null;
    
    this.initializeBackgroundSync();
  }

  // Initialize background sync system
  async initializeBackgroundSync() {
    try {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        logger.info('Background sync manager initialized', 'BACKGROUND_SYNC');
      }
      
      // Setup network status monitoring
      this.setupNetworkMonitoring();
      
      // Setup default sync strategies
      this.setupDefaultStrategies();
      
      // Setup default conflict resolvers
      this.setupDefaultConflictResolvers();
      
      // Setup default retry policies
      this.setupDefaultRetryPolicies();
      
    } catch (error) {
      logger.error('Failed to initialize background sync', 'BACKGROUND_SYNC', error);
    }
  }

  // Setup network monitoring
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processAllQueues();
      logger.info('Network online - processing sync queues', 'BACKGROUND_SYNC');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Network offline - queuing operations', 'BACKGROUND_SYNC');
    });
  }

  // Setup default sync strategies
  setupDefaultStrategies() {
    // Emergency requests - highest priority, immediate sync
    this.registerSyncStrategy('emergency_request', {
      priority: 1,
      maxRetries: 5,
      retryDelay: 1000,
      exponentialBackoff: true,
      requiresNetwork: true,
      conflictResolution: 'server_wins'
    });

    // Donor responses - high priority
    this.registerSyncStrategy('donor_response', {
      priority: 2,
      maxRetries: 3,
      retryDelay: 2000,
      exponentialBackoff: true,
      requiresNetwork: true,
      conflictResolution: 'timestamp_wins'
    });

    // Profile updates - medium priority
    this.registerSyncStrategy('profile_update', {
      priority: 3,
      maxRetries: 3,
      retryDelay: 5000,
      exponentialBackoff: true,
      requiresNetwork: true,
      conflictResolution: 'merge_changes'
    });

    // Analytics events - low priority
    this.registerSyncStrategy('analytics_event', {
      priority: 4,
      maxRetries: 2,
      retryDelay: 10000,
      exponentialBackoff: false,
      requiresNetwork: true,
      conflictResolution: 'client_wins'
    });
  }

  // Setup default conflict resolvers
  setupDefaultConflictResolvers() {
    this.registerConflictResolver('server_wins', (clientData, serverData) => {
      // Always prefer server data in conflicts
      return serverData;
    });
    
    this.registerConflictResolver('client_wins', (clientData, serverData) => {
      // Always prefer client data in conflicts
      return clientData;
    });
    
    this.registerConflictResolver('timestamp_wins', (clientData, serverData) => {
      const clientTime = new Date(clientData.timestamp || 0);
      const serverTime = new Date(serverData.timestamp || 0);
      return clientTime > serverTime ? clientData : serverData;
    });
    
    this.registerConflictResolver('merge_changes', (clientData, serverData) => {
      return { ...serverData, ...clientData, mergedAt: Date.now() };
    });
  }

  // Setup default retry policies
  setupDefaultRetryPolicies() {
    this.registerRetryPolicy('exponential_backoff', (attempt, baseDelay) => {
      return baseDelay * Math.pow(2, attempt - 1);
    });
    
    this.registerRetryPolicy('linear_backoff', (attempt, baseDelay) => {
      return baseDelay * attempt;
    });
    
    this.registerRetryPolicy('fixed_delay', (baseDelay) => {
      return baseDelay;
    });
  }

  // Register sync strategy
  registerSyncStrategy(type, strategy) {
    this.syncStrategies.set(type, {
      priority: 5,
      maxRetries: 3,
      retryDelay: 5000,
      exponentialBackoff: true,
      requiresNetwork: true,
      conflictResolution: 'server_wins',
      ...strategy
    });
  }

  // Register conflict resolver
  registerConflictResolver(name, resolver) {
    this.conflictResolvers.set(name, resolver);
  }

  // Register retry policy
  registerRetryPolicy(name, policy) {
    this.retryPolicies.set(name, policy);
  }

  // Queue operation for background sync
  async queueOperation(type, data, options = {}) {
    const operation = {
      id: this.generateOperationId(),
      type,
      data,
      timestamp: Date.now(),
      attempts: 0,
      status: 'queued',
      options: {
        immediate: false,
        ...options
      }
    };

    // Get or create queue for this type
    if (!this.syncQueues.has(type)) {
      this.syncQueues.set(type, []);
    }

    const queue = this.syncQueues.get(type);
    queue.push(operation);

    // Sort queue by priority and timestamp
    this.sortQueue(type);

    logger.debug(`Operation queued: ${type}`, 'BACKGROUND_SYNC', { operationId: operation.id });

    // Try immediate sync if online and immediate flag is set
    if (this.isOnline && options.immediate) {
      await this.processQueue(type);
    } else if (this.serviceWorkerRegistration) {
      // Register for background sync
      try {
        await this.serviceWorkerRegistration.sync.register(`sync-${type}`);
      } catch (error) {
        logger.warn('Failed to register background sync', 'BACKGROUND_SYNC', error);
      }
    }

    return operation.id;
  }

  // Sort queue by priority and timestamp
  sortQueue(type) {
    const queue = this.syncQueues.get(type);
    if (!queue) return;

    queue.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      const aPriority = this.syncStrategies.get(a.type)?.priority || 5;
      const bPriority = this.syncStrategies.get(b.type)?.priority || 5;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then sort by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  // Process all queues
  async processAllQueues() {
    const queueTypes = Array.from(this.syncQueues.keys());
    
    // Sort queue types by priority
    queueTypes.sort((a, b) => {
      const aPriority = this.syncStrategies.get(a)?.priority || 5;
      const bPriority = this.syncStrategies.get(b)?.priority || 5;
      return aPriority - bPriority;
    });

    // Process queues in priority order
    for (const type of queueTypes) {
      await this.processQueue(type);
    }
  }

  // Process specific queue
  async processQueue(type) {
    const queue = this.syncQueues.get(type);
    if (!queue || queue.length === 0) return;

    const strategy = this.syncStrategies.get(type);
    if (!strategy) {
      logger.warn(`No sync strategy found for type: ${type}`, 'BACKGROUND_SYNC');
      return;
    }

    // Process operations in queue
    const operations = [...queue];
    for (const operation of operations) {
      if (operation.status === 'processing' || operation.status === 'completed') {
        continue;
      }

      try {
        await this.processOperation(operation, strategy);
      } catch (error) {
        logger.error(`Failed to process operation: ${operation.id}`, 'BACKGROUND_SYNC', error);
      }
    }

    // Clean up completed operations
    this.cleanupQueue(type);
  }

  // Process individual operation
  async processOperation(operation, strategy) {
    if (!this.isOnline && strategy.requiresNetwork) {
      logger.debug(`Operation ${operation.id} requires network - skipping`, 'BACKGROUND_SYNC');
      return;
    }

    operation.status = 'processing';
    operation.attempts++;

    try {
      // Validate operation data
      const validationResult = security.validateInput(JSON.stringify(operation.data));
      if (!validationResult.isValid) {
        throw new Error(`Invalid operation data: ${validationResult.error}`);
      }

      // Execute sync operation
      const result = await this.executeSync(operation);
      
      if (result.success) {
        operation.status = 'completed';
        operation.completedAt = Date.now();
        operation.result = result.data;
        
        logger.info(`Operation completed: ${operation.id}`, 'BACKGROUND_SYNC');
      } else {
        throw new Error(result.error || 'Sync operation failed');
      }

    } catch (error) {
      operation.status = 'failed';
      operation.lastError = error.message;
      operation.lastAttemptAt = Date.now();

      // Check if we should retry
      if (operation.attempts < strategy.maxRetries) {
        operation.status = 'queued';
        
        // Calculate retry delay
        const delay = strategy.exponentialBackoff
          ? this.retryPolicies.get('exponential_backoff')(operation.attempts, strategy.retryDelay)
          : strategy.retryDelay;

        // Schedule retry
        setTimeout(() => {
          this.processOperation(operation, strategy);
        }, delay);

        logger.warn(`Operation ${operation.id} failed, retrying in ${delay}ms`, 'BACKGROUND_SYNC', error);
      } else {
        logger.error(`Operation ${operation.id} failed permanently after ${operation.attempts} attempts`, 'BACKGROUND_SYNC', error);
      }
    }
  }

  // Execute sync operation
  async executeSync(operation) {
    const { type, data } = operation;

    try {
      // Determine API endpoint based on operation type
      const endpoint = this.getEndpointForType(type);
      
      // Prepare request
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Operation': operation.id
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: operation.timestamp,
          clientId: this.getClientId()
        })
      };

      // Execute request
      const response = await fetch(endpoint, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle conflicts if server returns conflict data
      if (result.conflict) {
        const resolvedData = await this.resolveConflict(operation, result.conflict);
        return { success: true, data: resolvedData };
      }

      return { success: true, data: result };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Resolve data conflicts
  async resolveConflict(operation, conflictData) {
    const strategy = this.syncStrategies.get(operation.type);
    const resolverName = strategy?.conflictResolution || 'server_wins';
    const resolver = this.conflictResolvers.get(resolverName);

    if (!resolver) {
      logger.warn(`No conflict resolver found: ${resolverName}`, 'BACKGROUND_SYNC');
      return conflictData.serverData;
    }

    try {
      const resolvedData = resolver(operation.data, conflictData.serverData);
      
      // Send resolved data back to server
      const endpoint = this.getEndpointForType(operation.type);
      await fetch(`${endpoint}/resolve-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId: operation.id,
          resolvedData,
          conflictId: conflictData.conflictId
        })
      });

      logger.info(`Conflict resolved for operation: ${operation.id}`, 'BACKGROUND_SYNC');
      return resolvedData;

    } catch (error) {
      logger.error(`Failed to resolve conflict for operation: ${operation.id}`, 'BACKGROUND_SYNC', error);
      return conflictData.serverData;
    }
  }

  // Get API endpoint for operation type
  getEndpointForType(type) {
    const endpoints = {
      emergency_request: '/api/v1/emergency-requests/sync',
      donor_response: '/api/v1/donor-responses/sync',
      profile_update: '/api/v1/users/sync',
      analytics_event: '/api/v1/analytics/sync'
    };

    return endpoints[type] || '/api/v1/sync';
  }

  // Clean up completed operations from queue
  cleanupQueue(type) {
    const queue = this.syncQueues.get(type);
    if (!queue) return;

    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Remove completed operations older than maxAge
    const filteredQueue = queue.filter(operation => {
      if (operation.status === 'completed' && operation.completedAt) {
        return now - operation.completedAt < maxAge;
      }
      return true;
    });

    this.syncQueues.set(type, filteredQueue);
  }

  // Get sync status for operation
  getOperationStatus(operationId) {
    for (const [type, queue] of this.syncQueues) {
      const operation = queue.find(op => op.id === operationId);
      if (operation) {
        return {
          id: operation.id,
          type: operation.type,
          status: operation.status,
          attempts: operation.attempts,
          timestamp: operation.timestamp,
          completedAt: operation.completedAt,
          lastError: operation.lastError
        };
      }
    }
    return null;
  }

  // Get queue status
  getQueueStatus(type) {
    const queue = this.syncQueues.get(type) || [];
    
    return {
      type,
      total: queue.length,
      queued: queue.filter(op => op.status === 'queued').length,
      processing: queue.filter(op => op.status === 'processing').length,
      completed: queue.filter(op => op.status === 'completed').length,
      failed: queue.filter(op => op.status === 'failed').length
    };
  }

  // Get all queue statuses
  getAllQueueStatuses() {
    const statuses = {};
    for (const type of this.syncQueues.keys()) {
      statuses[type] = this.getQueueStatus(type);
    }
    return statuses;
  }

  // Cancel operation
  cancelOperation(operationId) {
    for (const [type, queue] of this.syncQueues) {
      const index = queue.findIndex(op => op.id === operationId);
      if (index !== -1) {
        const operation = queue[index];
        if (operation.status === 'queued') {
          queue.splice(index, 1);
          logger.info(`Operation cancelled: ${operationId}`, 'BACKGROUND_SYNC');
          return true;
        }
      }
    }
    return false;
  }

  // Clear all queues
  clearAllQueues() {
    this.syncQueues.clear();
    logger.info('All sync queues cleared', 'BACKGROUND_SYNC');
  }

  // Clear specific queue
  clearQueue(type) {
    this.syncQueues.delete(type);
    logger.info(`Sync queue cleared: ${type}`, 'BACKGROUND_SYNC');
  }

  // Utility methods
  generateOperationId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getClientId() {
    let clientId = localStorage.getItem('client_id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('client_id', clientId);
    }
    return clientId;
  }

  // Export queue data for debugging
  exportQueueData() {
    const data = {
      queues: Object.fromEntries(this.syncQueues),
      strategies: Object.fromEntries(this.syncStrategies),
      isOnline: this.isOnline,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Create singleton instance
const backgroundSyncManager = new BackgroundSyncManager();

export default backgroundSyncManager;
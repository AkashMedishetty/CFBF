import logger from './logger';

class ConflictResolver {
  constructor() {
    this.resolutionStrategies = {
      'last_write_wins': this.lastWriteWins.bind(this),
      'server_wins': this.serverWins.bind(this),
      'client_wins': this.clientWins.bind(this),
      'merge': this.mergeData.bind(this),
      'user_choice': this.userChoice.bind(this)
    };
    
    // Field-specific resolution rules
    this.fieldRules = {
      // Profile fields
      'profile.firstName': 'last_write_wins',
      'profile.lastName': 'last_write_wins',
      'profile.email': 'server_wins', // Email changes need server validation
      'profile.phone': 'server_wins', // Phone changes need server validation
      'profile.bloodType': 'server_wins', // Critical medical data
      'profile.weight': 'last_write_wins',
      'profile.height': 'last_write_wins',
      
      // Availability and preferences
      'availability.isAvailable': 'last_write_wins',
      'availability.lastDonation': 'server_wins', // Server has authoritative donation records
      'preferences.maxTravelDistance': 'last_write_wins',
      'preferences.notificationMethods': 'merge',
      
      // Emergency response data
      'emergencyResponse.response': 'server_wins', // Server decides final response
      'emergencyResponse.timestamp': 'server_wins',
      
      // Donation records
      'donation.date': 'server_wins',
      'donation.location': 'server_wins',
      'donation.verified': 'server_wins'
    };
    
    logger.info('ConflictResolver initialized', 'CONFLICT_RESOLVER');
  }

  // Main conflict resolution method
  async resolveConflict(conflictData) {
    try {
      logger.info('Resolving data conflict', 'CONFLICT_RESOLVER', {
        type: conflictData.type,
        field: conflictData.field,
        hasClientData: !!conflictData.clientData,
        hasServerData: !!conflictData.serverData
      });

      const { type, field, clientData, serverData, metadata } = conflictData;
      
      // Determine resolution strategy
      const strategy = this.getResolutionStrategy(type, field);
      
      // Apply resolution strategy
      const resolution = await this.resolutionStrategies[strategy](
        clientData,
        serverData,
        metadata
      );

      logger.success('Conflict resolved', 'CONFLICT_RESOLVER', {
        strategy,
        field,
        resolution: resolution.action
      });

      return {
        success: true,
        strategy,
        resolution,
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Conflict resolution failed', 'CONFLICT_RESOLVER', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Get resolution strategy for a specific field
  getResolutionStrategy(type, field) {
    // Check field-specific rules first
    if (this.fieldRules[field]) {
      return this.fieldRules[field];
    }

    // Type-specific defaults
    switch (type) {
      case 'profile_update':
        return 'last_write_wins';
      case 'availability_update':
        return 'last_write_wins';
      case 'emergency_response':
        return 'server_wins';
      case 'donation_record':
        return 'server_wins';
      case 'preferences':
        return 'merge';
      default:
        return 'last_write_wins';
    }
  }

  // Resolution Strategy: Last Write Wins
  async lastWriteWins(clientData, serverData, metadata) {
    const clientTimestamp = this.getTimestamp(clientData, metadata);
    const serverTimestamp = this.getTimestamp(serverData, metadata);

    if (clientTimestamp > serverTimestamp) {
      return {
        action: 'use_client',
        data: clientData,
        reason: 'Client data is newer'
      };
    } else {
      return {
        action: 'use_server',
        data: serverData,
        reason: 'Server data is newer'
      };
    }
  }

  // Resolution Strategy: Server Always Wins
  async serverWins(clientData, serverData, metadata) {
    return {
      action: 'use_server',
      data: serverData,
      reason: 'Server data takes precedence'
    };
  }

  // Resolution Strategy: Client Always Wins
  async clientWins(clientData, serverData, metadata) {
    return {
      action: 'use_client',
      data: clientData,
      reason: 'Client data takes precedence'
    };
  }

  // Resolution Strategy: Merge Data
  async mergeData(clientData, serverData, metadata) {
    try {
      const merged = this.deepMerge(serverData, clientData);
      
      return {
        action: 'use_merged',
        data: merged,
        reason: 'Data merged from both sources'
      };
    } catch (error) {
      logger.warn('Merge failed, falling back to last write wins', 'CONFLICT_RESOLVER', error);
      return await this.lastWriteWins(clientData, serverData, metadata);
    }
  }

  // Resolution Strategy: User Choice (for critical conflicts)
  async userChoice(clientData, serverData, metadata) {
    // In a real implementation, this would show a UI for user to choose
    // For now, we'll return a structure that indicates user input is needed
    return {
      action: 'user_input_required',
      clientData,
      serverData,
      reason: 'User decision required for this conflict'
    };
  }

  // Deep merge two objects
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (this.isObject(source[key]) && this.isObject(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  // Check if value is an object
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Get timestamp from data or metadata
  getTimestamp(data, metadata) {
    // Try to get timestamp from various possible locations
    if (data && data.updatedAt) {
      return new Date(data.updatedAt).getTime();
    }
    if (data && data.timestamp) {
      return new Date(data.timestamp).getTime();
    }
    if (metadata && metadata.timestamp) {
      return new Date(metadata.timestamp).getTime();
    }
    if (metadata && metadata.lastModified) {
      return new Date(metadata.lastModified).getTime();
    }
    
    // Default to current time if no timestamp found
    return Date.now();
  }

  // Resolve multiple conflicts in batch
  async resolveMultipleConflicts(conflicts) {
    const results = [];
    
    for (const conflict of conflicts) {
      const result = await this.resolveConflict(conflict);
      results.push({
        ...conflict,
        resolution: result
      });
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.resolution.success).length,
      failed: results.filter(r => !r.resolution.success).length,
      userInputRequired: results.filter(r => 
        r.resolution.success && r.resolution.resolution.action === 'user_input_required'
      ).length
    };

    logger.info('Batch conflict resolution completed', 'CONFLICT_RESOLVER', summary);

    return {
      results,
      summary
    };
  }

  // Create conflict detection for data comparison
  detectConflicts(clientData, serverData, type) {
    const conflicts = [];

    // Compare objects recursively
    const compareObjects = (client, server, path = '') => {
      const allKeys = new Set([
        ...Object.keys(client || {}),
        ...Object.keys(server || {})
      ]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const clientValue = client?.[key];
        const serverValue = server?.[key];

        if (this.isObject(clientValue) && this.isObject(serverValue)) {
          // Recursively compare nested objects
          compareObjects(clientValue, serverValue, currentPath);
        } else if (clientValue !== serverValue) {
          // Values are different, potential conflict
          conflicts.push({
            type,
            field: currentPath,
            clientData: clientValue,
            serverData: serverValue,
            metadata: {
              timestamp: Date.now(),
              detectedAt: new Date().toISOString()
            }
          });
        }
      }
    };

    compareObjects(clientData, serverData);

    logger.debug(`Detected ${conflicts.length} potential conflicts`, 'CONFLICT_RESOLVER', {
      type,
      conflictFields: conflicts.map(c => c.field)
    });

    return conflicts;
  }

  // Apply resolution to actual data
  async applyResolution(originalData, resolution) {
    try {
      switch (resolution.action) {
        case 'use_client':
          return resolution.data;
          
        case 'use_server':
          return resolution.data;
          
        case 'use_merged':
          return resolution.data;
          
        case 'user_input_required':
          // Store conflict for later user resolution
          await this.storeUserConflict(resolution);
          return originalData; // Keep original until user decides
          
        default:
          logger.warn(`Unknown resolution action: ${resolution.action}`, 'CONFLICT_RESOLVER');
          return originalData;
      }
    } catch (error) {
      logger.error('Failed to apply resolution', 'CONFLICT_RESOLVER', error);
      return originalData;
    }
  }

  // Store conflict that requires user input
  async storeUserConflict(resolution) {
    try {
      const conflicts = JSON.parse(localStorage.getItem('pending_conflicts') || '[]');
      conflicts.push({
        id: this.generateConflictId(),
        ...resolution,
        createdAt: Date.now()
      });
      
      localStorage.setItem('pending_conflicts', JSON.stringify(conflicts));
      
      // Notify user about pending conflicts
      this.notifyUserOfConflicts();
      
    } catch (error) {
      logger.error('Failed to store user conflict', 'CONFLICT_RESOLVER', error);
    }
  }

  // Generate unique conflict ID
  generateConflictId() {
    return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Notify user about pending conflicts
  notifyUserOfConflicts() {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('conflictsDetected', {
      detail: { message: 'Data conflicts detected. Please review and resolve.' }
    }));
  }

  // Get pending user conflicts
  getPendingConflicts() {
    try {
      return JSON.parse(localStorage.getItem('pending_conflicts') || '[]');
    } catch (error) {
      logger.error('Failed to get pending conflicts', 'CONFLICT_RESOLVER', error);
      return [];
    }
  }

  // Resolve user conflict with user's choice
  async resolveUserConflict(conflictId, userChoice) {
    try {
      const conflicts = this.getPendingConflicts();
      const conflictIndex = conflicts.findIndex(c => c.id === conflictId);
      
      if (conflictIndex === -1) {
        throw new Error('Conflict not found');
      }

      const conflict = conflicts[conflictIndex];
      let resolvedData;

      switch (userChoice) {
        case 'use_client':
          resolvedData = conflict.clientData;
          break;
        case 'use_server':
          resolvedData = conflict.serverData;
          break;
        case 'merge':
          resolvedData = this.deepMerge(conflict.serverData, conflict.clientData);
          break;
        default:
          throw new Error('Invalid user choice');
      }

      // Remove resolved conflict
      conflicts.splice(conflictIndex, 1);
      localStorage.setItem('pending_conflicts', JSON.stringify(conflicts));

      logger.success('User conflict resolved', 'CONFLICT_RESOLVER', {
        conflictId,
        userChoice
      });

      return {
        success: true,
        data: resolvedData,
        choice: userChoice
      };

    } catch (error) {
      logger.error('Failed to resolve user conflict', 'CONFLICT_RESOLVER', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clear all pending conflicts
  clearPendingConflicts() {
    localStorage.removeItem('pending_conflicts');
    logger.debug('Pending conflicts cleared', 'CONFLICT_RESOLVER');
  }
}

// Create singleton instance
const conflictResolver = new ConflictResolver();

export default conflictResolver;
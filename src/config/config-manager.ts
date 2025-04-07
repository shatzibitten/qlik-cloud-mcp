/**
 * Configuration manager interface
 */
export interface ConfigManager {
  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value
   */
  get<T>(key: string, defaultValue?: T): T;
  
  /**
   * Set a configuration value
   * @param key The configuration key
   * @param value The configuration value
   */
  set<T>(key: string, value: T): void;
  
  /**
   * Check if a configuration key exists
   * @param key The configuration key
   * @returns Boolean indicating if the key exists
   */
  has(key: string): boolean;
  
  /**
   * Get all configuration values
   * @returns Record of all configuration values
   */
  getAll(): Record<string, any>;
}

/**
 * Environment configuration manager class
 * Loads configuration from environment variables
 */
export class EnvConfigManager implements ConfigManager {
  private config: Record<string, any>;
  
  /**
   * Constructor
   * @param prefix Optional prefix for environment variables
   */
  constructor(prefix: string = '') {
    this.config = {};
    this.loadFromEnv(prefix);
  }
  
  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.config[key];
    return value !== undefined ? value : defaultValue as T;
  }
  
  /**
   * Set a configuration value
   * @param key The configuration key
   * @param value The configuration value
   */
  set<T>(key: string, value: T): void {
    this.config[key] = value;
  }
  
  /**
   * Check if a configuration key exists
   * @param key The configuration key
   * @returns Boolean indicating if the key exists
   */
  has(key: string): boolean {
    return this.config[key] !== undefined;
  }
  
  /**
   * Get all configuration values
   * @returns Record of all configuration values
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }
  
  /**
   * Load configuration from environment variables
   * @param prefix Optional prefix for environment variables
   */
  private loadFromEnv(prefix: string): void {
    // Process environment variables
    for (const [key, value] of Object.entries(process.env)) {
      // Skip if value is undefined
      if (value === undefined) {
        continue;
      }
      
      // Skip if key doesn't match prefix
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }
      
      // Remove prefix from key
      const configKey = prefix ? key.substring(prefix.length) : key;
      
      // Convert to nested structure
      this.setNestedValue(configKey, this.parseValue(value));
    }
  }
  
  /**
   * Set a nested value in the configuration
   * @param key The key with dot notation
   * @param value The value to set
   */
  private setNestedValue(key: string, value: any): void {
    // Split key by dots or underscores
    const parts = key.split(/[._]/);
    let current = this.config;
    
    // Navigate to the correct nesting level
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i].toLowerCase();
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value at the final level
    const finalKey = parts[parts.length - 1].toLowerCase();
    current[finalKey] = value;
  }
  
  /**
   * Parse a string value to the appropriate type
   * @param value The string value
   * @returns The parsed value
   */
  private parseValue(value: string): any {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // Not valid JSON, return as is
      return value;
    }
  }
}

/**
 * File configuration manager class
 * Loads configuration from a file
 */
export class FileConfigManager implements ConfigManager {
  private config: Record<string, any>;
  
  /**
   * Constructor
   * @param filePath Path to the configuration file
   */
  constructor(filePath: string) {
    this.config = {};
    this.loadFromFile(filePath);
  }
  
  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(key);
    return value !== undefined ? value : defaultValue as T;
  }
  
  /**
   * Set a configuration value
   * @param key The configuration key
   * @param value The configuration value
   */
  set<T>(key: string, value: T): void {
    this.setNestedValue(key, value);
  }
  
  /**
   * Check if a configuration key exists
   * @param key The configuration key
   * @returns Boolean indicating if the key exists
   */
  has(key: string): boolean {
    return this.getNestedValue(key) !== undefined;
  }
  
  /**
   * Get all configuration values
   * @returns Record of all configuration values
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }
  
  /**
   * Load configuration from a file
   * @param filePath Path to the configuration file
   */
  private loadFromFile(filePath: string): void {
    try {
      // Import file system module
      const fs = require('fs');
      
      // Read and parse file
      const content = fs.readFileSync(filePath, 'utf8');
      this.config = JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load configuration from file: ${error}`);
    }
  }
  
  /**
   * Get a nested value from the configuration
   * @param key The key with dot notation
   * @returns The value or undefined
   */
  private getNestedValue(key: string): any {
    // Split key by dots
    const parts = key.split('.');
    let current = this.config;
    
    // Navigate to the correct nesting level
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Set a nested value in the configuration
   * @param key The key with dot notation
   * @param value The value to set
   */
  private setNestedValue(key: string, value: any): void {
    // Split key by dots
    const parts = key.split('.');
    let current = this.config;
    
    // Navigate to the correct nesting level
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value at the final level
    const finalKey = parts[parts.length - 1];
    current[finalKey] = value;
  }
}

/**
 * Composite configuration manager class
 * Combines multiple configuration managers with priority
 */
export class CompositeConfigManager implements ConfigManager {
  private managers: ConfigManager[];
  
  /**
   * Constructor
   * @param managers Configuration managers in priority order (first has highest priority)
   */
  constructor(managers: ConfigManager[]) {
    this.managers = managers;
  }
  
  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    // Check each manager in priority order
    for (const manager of this.managers) {
      if (manager.has(key)) {
        return manager.get<T>(key);
      }
    }
    
    return defaultValue as T;
  }
  
  /**
   * Set a configuration value
   * @param key The configuration key
   * @param value The configuration value
   */
  set<T>(key: string, value: T): void {
    // Set in the highest priority manager
    if (this.managers.length > 0) {
      this.managers[0].set(key, value);
    }
  }
  
  /**
   * Check if a configuration key exists
   * @param key The configuration key
   * @returns Boolean indicating if the key exists
   */
  has(key: string): boolean {
    // Check each manager in priority order
    for (const manager of this.managers) {
      if (manager.has(key)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get all configuration values
   * @returns Record of all configuration values
   */
  getAll(): Record<string, any> {
    // Combine all configurations with priority
    const result: Record<string, any> = {};
    
    // Start with lowest priority
    for (let i = this.managers.length - 1; i >= 0; i--) {
      const config = this.managers[i].getAll();
      Object.assign(result, config);
    }
    
    return result;
  }
  
  /**
   * Add a configuration manager
   * @param manager The configuration manager to add
   * @param priority The priority (0 = highest)
   */
  addManager(manager: ConfigManager, priority: number = 0): void {
    this.managers.splice(priority, 0, manager);
  }
}

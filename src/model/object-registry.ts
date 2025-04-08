/**
 * ObjectRegistry class for tracking objects in a model context
 * 
 * This class maintains a registry of all objects created within a model context,
 * tracking their handles, types, properties, and state.
 */
export class ObjectRegistry {
  private _contextId: string;
  private _objects: Map<string, any> = new Map();

  /**
   * Creates a new ObjectRegistry instance
   * 
   * @param contextId - ID of the associated model context
   */
  constructor(contextId: string) {
    this._contextId = contextId;
  }

  /**
   * Register a new object in the registry
   * 
   * @param handle - Object handle
   * @param type - Object type
   * @param properties - Object properties
   * @returns The registered object metadata
   */
  registerObject(handle: string, type: string, properties: any): any {
    const objectMeta = {
      handle,
      type,
      properties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this._objects.set(handle, objectMeta);
    return objectMeta;
  }

  /**
   * Update an object's properties in the registry
   * 
   * @param handle - Object handle
   * @param properties - Updated object properties
   * @returns The updated object metadata or null if not found
   */
  updateObject(handle: string, properties: any): any | null {
    const objectMeta = this._objects.get(handle);
    
    if (!objectMeta) {
      return null;
    }
    
    objectMeta.properties = properties;
    objectMeta.updatedAt = new Date().toISOString();
    
    this._objects.set(handle, objectMeta);
    return objectMeta;
  }

  /**
   * Unregister an object from the registry
   * 
   * @param handle - Object handle
   * @returns True if the object was unregistered, false if not found
   */
  unregisterObject(handle: string): boolean {
    return this._objects.delete(handle);
  }

  /**
   * Get an object's metadata from the registry
   * 
   * @param handle - Object handle
   * @returns The object metadata or null if not found
   */
  getObject(handle: string): any | null {
    return this._objects.get(handle) || null;
  }

  /**
   * Check if an object exists in the registry
   * 
   * @param handle - Object handle
   * @returns True if the object exists, false otherwise
   */
  hasObject(handle: string): boolean {
    return this._objects.has(handle);
  }

  /**
   * Get all objects in the registry
   * 
   * @returns Array of all object metadata
   */
  getAllObjects(): any[] {
    return Array.from(this._objects.values());
  }

  /**
   * Get objects of a specific type
   * 
   * @param type - Object type
   * @returns Array of object metadata matching the type
   */
  getObjectsByType(type: string): any[] {
    return Array.from(this._objects.values())
      .filter(obj => obj.type === type);
  }

  /**
   * Get the current state of the object registry
   * 
   * @returns The registry state
   */
  getState(): any {
    return {
      objects: Array.from(this._objects.entries()).reduce((acc, [handle, meta]) => {
        acc[handle] = meta;
        return acc;
      }, {} as Record<string, any>)
    };
  }

  /**
   * Set the state of the object registry
   * 
   * @param state - The registry state to set
   */
  async setState(state: any): Promise<void> {
    // Clear existing objects
    this._objects.clear();
    
    // Restore objects from state
    if (state.objects) {
      Object.entries(state.objects).forEach(([handle, meta]) => {
        this._objects.set(handle, meta);
      });
    }
  }

  /**
   * Clear all objects from the registry
   */
  clear(): void {
    this._objects.clear();
  }

  /**
   * Get the number of objects in the registry
   * 
   * @returns The number of objects
   */
  get size(): number {
    return this._objects.size;
  }
}

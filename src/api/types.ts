/**
 * API request interface
 */
export interface APIRequest {
  /**
   * The HTTP method
   */
  method: string;
  
  /**
   * The API path
   */
  path: string;
  
  /**
   * Query parameters (optional)
   */
  query?: Record<string, string>;
  
  /**
   * Request headers (optional)
   */
  headers?: Record<string, string>;
  
  /**
   * Request body (optional)
   */
  body?: any;
}

/**
 * API response interface
 */
export interface APIResponse {
  /**
   * The HTTP status code
   */
  statusCode: number;
  
  /**
   * Response headers
   */
  headers: Record<string, string>;
  
  /**
   * Response body
   */
  body: any;
}

/**
 * API error class
 */
export class APIError extends Error {
  /**
   * Error code
   */
  code: string;
  
  /**
   * HTTP status code
   */
  statusCode?: number;
  
  /**
   * Error details
   */
  details?: Record<string, any>;
  
  /**
   * Constructor
   * @param message Error message
   * @param options Error options
   */
  constructor(message: string, options?: { code?: string; statusCode?: number; details?: Record<string, any>; cause?: Error }) {
    super(message, { cause: options?.cause });
    this.name = 'APIError';
    this.code = options?.code || 'API_ERROR';
    this.statusCode = options?.statusCode;
    this.details = options?.details;
  }
}

/**
 * Request error class
 */
export class RequestError extends APIError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'REQUEST_ERROR', details: options?.details, cause: options?.cause });
    this.name = 'RequestError';
  }
}

/**
 * Response error class
 */
export class ResponseError extends APIError {
  constructor(message: string, options?: { code?: string; statusCode?: number; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'RESPONSE_ERROR', statusCode: options?.statusCode, details: options?.details, cause: options?.cause });
    this.name = 'ResponseError';
  }
}

/**
 * Resource not found error class
 */
export class ResourceNotFoundError extends APIError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'RESOURCE_NOT_FOUND', statusCode: 404, details: options?.details, cause: options?.cause });
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends APIError {
  constructor(message: string, options?: { code?: string; statusCode?: number; details?: Record<string, any>; cause?: Error }) {
    super(message, { 
      code: options?.code || 'AUTHORIZATION_ERROR', 
      statusCode: options?.statusCode || 403, 
      details: options?.details, 
      cause: options?.cause 
    });
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends APIError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'VALIDATION_ERROR', statusCode: 400, details: options?.details, cause: options?.cause });
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends APIError {
  constructor(message: string, options?: { code?: string; details?: Record<string, any>; cause?: Error }) {
    super(message, { code: options?.code || 'RATE_LIMIT_ERROR', statusCode: 429, details: options?.details, cause: options?.cause });
    this.name = 'RateLimitError';
  }
}

/**
 * Server error class
 */
export class ServerError extends APIError {
  constructor(message: string, options?: { code?: string; statusCode?: number; details?: Record<string, any>; cause?: Error }) {
    super(message, { 
      code: options?.code || 'SERVER_ERROR', 
      statusCode: options?.statusCode || 500, 
      details: options?.details, 
      cause: options?.cause 
    });
    this.name = 'ServerError';
  }
}

import winston from 'winston';

/**
 * Log manager configuration interface
 */
export interface LogManagerConfig {
  /**
   * Log level
   */
  level: 'error' | 'warn' | 'info' | 'debug';
  
  /**
   * Log format
   */
  format: 'json' | 'simple';
}

/**
 * Log manager class
 * Handles logging for the application
 */
export class LogManager {
  public logger: winston.Logger;
  
  /**
   * Constructor
   * @param config Log manager configuration
   */
  constructor(config: LogManagerConfig) {
    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: config.level,
      format: config.format === 'json' ? winston.format.json() : winston.format.simple(),
      transports: [
        new winston.transports.Console()
      ]
    });
  }
  
  /**
   * Create request logger middleware
   * @returns Express middleware
   */
  requestLogger(): any {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      // Log request
      this.logger.info(`${req.method} ${req.path} started`);
      
      // Log response
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      
      next();
    };
  }
}

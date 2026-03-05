/**
 * Structured error logging utility for draft storage operations
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogCategory =
    | 'upload'
    | 'deletion'
    | 'cleanup'
    | 'validation'
    | 'storage'
    | 'database'
    | 'authentication';

export interface LogMetadata {
    [key: string]: any;
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: LogCategory;
    userId?: string;
    fileType?: string;
    errorMessage?: string;
    errorStack?: string;
    requestId?: string;
    metadata?: LogMetadata;
}

/**
 * Generates a unique request ID for tracking
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logs an error with structured data
 * 
 * @param level - Log level (info, warn, error, debug)
 * @param category - Category of the operation
 * @param message - Error or log message
 * @param options - Additional logging options
 */
export function logError(
    level: LogLevel,
    category: LogCategory,
    message: string,
    options?: {
        userId?: string;
        fileType?: string;
        error?: Error;
        requestId?: string;
        metadata?: LogMetadata;
    }
): void {
    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        userId: options?.userId,
        fileType: options?.fileType,
        errorMessage: message,
        errorStack: options?.error?.stack,
        requestId: options?.requestId || generateRequestId(),
        metadata: options?.metadata,
    };

    // Log to console with appropriate method
    const logMethod = level === 'error' ? console.error :
        level === 'warn' ? console.warn :
            level === 'debug' ? console.debug :
                console.log;

    logMethod(JSON.stringify(logEntry, null, 2));

    // In production, you might want to send logs to a service like:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - CloudWatch
    // - Custom logging service

    // Example: Send to external service
    // if (process.env.NODE_ENV === 'production') {
    //     sendToLoggingService(logEntry);
    // }
}

/**
 * Logs a successful upload operation
 */
export function logUpload(
    userId: string,
    fileType: string,
    filename: string,
    fileSize: number,
    success: boolean,
    error?: Error
): void {
    logError(
        success ? 'info' : 'error',
        'upload',
        success ? 'File uploaded successfully' : 'File upload failed',
        {
            userId,
            fileType,
            error,
            metadata: {
                filename,
                fileSize,
                success,
            },
        }
    );
}

/**
 * Logs a deletion operation
 */
export function logDeletion(
    userId: string,
    fileType: string,
    reason: 'user_replaced' | 'submission_cleanup' | 'expiration',
    success: boolean,
    error?: Error
): void {
    logError(
        success ? 'info' : 'error',
        'deletion',
        success ? 'File deleted successfully' : 'File deletion failed',
        {
            userId,
            fileType,
            error,
            metadata: {
                reason,
                success,
            },
        }
    );
}

/**
 * Logs cleanup job execution
 */
export function logCleanupJob(
    startTime: number,
    endTime: number,
    filesDeletedCount: number,
    errorsCount: number,
    error?: Error
): void {
    const executionTimeMs = endTime - startTime;

    logError(
        error ? 'error' : 'info',
        'cleanup',
        error ? 'Cleanup job failed' : 'Cleanup job completed',
        {
            error,
            metadata: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                executionTimeMs,
                filesDeletedCount,
                errorsCount,
            },
        }
    );
}

/**
 * Logs validation errors
 */
export function logValidationError(
    userId: string,
    fileType: string,
    validationError: string,
    metadata?: LogMetadata
): void {
    logError(
        'warn',
        'validation',
        validationError,
        {
            userId,
            fileType,
            metadata,
        }
    );
}

/**
 * Logs storage operations
 */
export function logStorageOperation(
    operation: 'upload' | 'download' | 'delete',
    userId: string,
    storagePath: string,
    success: boolean,
    error?: Error
): void {
    logError(
        success ? 'info' : 'error',
        'storage',
        `Storage ${operation} ${success ? 'succeeded' : 'failed'}`,
        {
            userId,
            error,
            metadata: {
                operation,
                storagePath,
                success,
            },
        }
    );
}

/**
 * Logs database operations
 */
export function logDatabaseOperation(
    operation: 'create' | 'read' | 'update' | 'delete',
    userId: string,
    fileType: string,
    success: boolean,
    error?: Error
): void {
    logError(
        success ? 'info' : 'error',
        'database',
        `Database ${operation} ${success ? 'succeeded' : 'failed'}`,
        {
            userId,
            fileType,
            error,
            metadata: {
                operation,
                success,
            },
        }
    );
}

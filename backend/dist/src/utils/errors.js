/**
 * Custom Error Classes for consistent error handling
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    timestamp;
    requestId;
    context;
    constructor(message, statusCode = 500, isOperational = true, context) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date();
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, context) {
        super(message, 400, true, context);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
export class AuthenticationError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, true);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
export class AuthorizationError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403, true);
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} tidak ditemukan`, 404, true);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409, true);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
export class InternalServerError extends AppError {
    constructor(message = "Internal Server Error", context) {
        super(message, 500, false, context);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
export class BadRequestError extends AppError {
    constructor(message = "Bad Request") {
        super(message, 400, true);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}
export function isAppError(error) {
    return error instanceof AppError;
}

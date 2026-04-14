/**
 * Wrapper untuk async route handlers
 * Automatically catches errors dan pass ke error middleware
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

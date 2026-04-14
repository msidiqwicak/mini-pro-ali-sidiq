import { errorResponse } from "../utils/response.js";
export const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            errorResponse(res, "Unauthorized", 401);
            return;
        }
        if (!roles.includes(req.user.role)) {
            errorResponse(res, "Forbidden - Insufficient permissions", 403);
            return;
        }
        next();
    };
};

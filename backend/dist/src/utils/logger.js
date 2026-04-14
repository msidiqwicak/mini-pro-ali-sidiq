import winston from "winston";
import path from "path";
const logDirectory = path.join(process.cwd(), "logs");
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: "event-platform-api" },
    transports: [
        // Console output
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
                return `[${timestamp}] ${level}: ${message} ${metaStr}`;
            })),
        }),
        // Error logs
        new winston.transports.File({
            filename: path.join(logDirectory, "error.log"),
            level: "error",
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        // All logs
        new winston.transports.File({
            filename: path.join(logDirectory, "combined.log"),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
});
export default logger;

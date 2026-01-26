"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./logger");
/**
 * Ensures a directory exists, creating it if necessary
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger_1.logger.info('FileStorage', `Created directory: ${dirPath}`);
    }
}
/**
 * Reads a JSON file and returns parsed data
 * Returns undefined if file doesn't exist or is invalid
 */
function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return undefined;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        logger_1.logger.error('FileStorage', `Failed to read JSON file: ${filePath}`, error);
        return undefined;
    }
}
/**
 * Writes data to a JSON file using atomic write pattern (write to temp, then rename)
 * Creates parent directories if they don't exist
 */
function writeJsonFile(filePath, data) {
    try {
        const dirPath = path.dirname(filePath);
        ensureDirectoryExists(dirPath);
        const tempPath = `${filePath}.tmp`;
        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(tempPath, jsonContent, 'utf-8');
        fs.renameSync(tempPath, filePath);
        logger_1.logger.info('FileStorage', `Written JSON file: ${filePath}`);
    }
    catch (error) {
        logger_1.logger.error('FileStorage', `Failed to write JSON file: ${filePath}`, error);
        throw error;
    }
}

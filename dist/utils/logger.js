"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info(component, message, data) {
        console.log(`[${component}] ${message}`, data ? JSON.stringify(data) : '');
    },
    error(component, message, data) {
        console.error(`[${component}] ERROR: ${message}`, data ? JSON.stringify(data) : '');
    },
    warn(component, message, data) {
        console.warn(`[${component}] WARN: ${message}`, data ? JSON.stringify(data) : '');
    },
};

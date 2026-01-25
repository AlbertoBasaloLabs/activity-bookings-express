"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const activities_1 = __importDefault(require("./routes/activities"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'ActivityBookings API' });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/auth', auth_1.default);
app.use('/activities', activities_1.default);
app.listen(PORT, () => {
    logger_1.logger.info('Server', `Running on port ${PORT}`);
});
exports.default = app;

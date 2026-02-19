import cors from 'cors';
import express from 'express';
import activitiesRouter from './routes/activities';
import authRouter from './routes/auth';
import bookingsRouter from './routes/bookings';
import usersRouter from './routes/users';
import { loadAllData, userRepository } from './utils/data-loader';
import { logger } from './utils/logger';
import { getSecurityMode, OPEN_SECURITY_MODE } from './utils/security-mode';

// Load all data on startup
loadAllData();

const securityMode = getSecurityMode();
if (securityMode === OPEN_SECURITY_MODE && userRepository.getAll().length === 0) {
  const startupError = 'Open security mode requires at least one user in db/users.json';
  logger.error('Server', startupError);
  throw new Error(startupError);
}

logger.info('Server', `Security mode: ${securityMode}`);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ActivityBookings API' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/users', usersRouter);
app.use('/login', authRouter);
app.use('/activities', activitiesRouter);
app.use('/bookings', bookingsRouter);

app.listen(PORT, () => {
  logger.info('Server', `Running on port ${PORT}`);
});

export default app;

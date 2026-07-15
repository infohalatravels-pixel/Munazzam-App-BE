import { Router } from 'express';
import { authRouter } from '../modules/auth/index.js';
import { usersRouter } from '../modules/users/index.js';
import { attendanceRouter } from '../modules/attendance/index.js';
import { analyticsRouter } from '../modules/analytics/index.js';
import { rolesRouter } from '../modules/roles/index.js';
import { configRouter } from '../modules/config/config.route.js';
import { announcementsRouter } from '../modules/announcements/index.js';
import { accountsRouter } from '../modules/accounts/index.js';
import { transactionsRouter } from '../modules/transactions/index.js';
import { vendorsRouter } from '../modules/vendors/index.js';
import { clientsRouter } from '../modules/clients/index.js';

const v1Router = Router();

v1Router.use('/config', configRouter);

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/attendance', attendanceRouter);
v1Router.use('/analytics', analyticsRouter);
v1Router.use('/announcements', announcementsRouter);
v1Router.use('/accounts', accountsRouter);
v1Router.use('/transactions', transactionsRouter);
v1Router.use('/vendors', vendorsRouter);
v1Router.use('/clients', clientsRouter);
v1Router.use('/roles', rolesRouter);

export { v1Router };

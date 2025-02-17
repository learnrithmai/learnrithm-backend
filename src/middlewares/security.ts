import cors from 'cors';
import helmet from 'helmet';
import { Application } from 'express';

const applySecurityMiddleware = (app: Application) => {
  app.use(cors());
  app.use(helmet());
};

export default applySecurityMiddleware;
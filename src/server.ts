import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from './middlewares/logger';
import applySecurityMiddleware from './middlewares/security';
import errorHandler from './middlewares/error-handler';
import userRoutes from './routes/user.routes';
import path from 'path';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(logger);
applySecurityMiddleware(app);

// Serve static files from the "static" folder
app.use(express.static(path.join(__dirname, '../public', 'static')));

// Default route - serve the HTML page with the image and text
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'static', 'index.html'));
});

//APIs Consume 
app.use('/v2/api/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
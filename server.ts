import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes.ts';
import productRoutes from './server/routes/productRoutes.ts';
import warehouseRoutes from './server/routes/warehouseRoutes.ts';
import inventoryRoutes from './server/routes/inventoryRoutes.ts';
import cartRoutes from './server/routes/cartRoutes.ts';
import orderRoutes from './server/routes/orderRoutes.ts';
import paymentRoutes from './server/routes/paymentRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import aiRoutes from './server/routes/aiRoutes.ts';
import healthRoutes from './server/routes/healthRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Core Middlewares
app.use(cors());
app.use(express.json());

// Request logger for API calls
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Mount REST API Routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', healthRoutes);

// Global 404 handler for unknown /api routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found. Check /api/health or view API Documentation.',
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static client from dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 E-Commerce Product & Order Management System`);
    console.log(`📡 Server listening on http://0.0.0.0:${PORT}`);
    console.log(`📦 Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🧪 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🔑 Demo Admin: admin@ecommerce.com / admin123`);
    console.log(`👤 Demo Customer: john@example.com / customer123`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});

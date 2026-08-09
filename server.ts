import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './server/app';

async function startServer() {
  const PORT = 3000;

  // Vite middleware in development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(expressStatic(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

// Express static helper wrapper if needed
import express from 'express';
const expressStatic = express.static;

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

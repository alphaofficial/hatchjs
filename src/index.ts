import express from 'express';
import path from 'path';
import routes from './routes/route';

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory (template.html)
app.use('/', express.static(path.join(process.cwd(), 'public')));

// Serve built assets from dist directory
app.use('/', express.static(path.join(process.cwd(), 'dist')));

// Routes
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
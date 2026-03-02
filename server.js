// Additional imports... 
const fs = require('fs').promises;

// Other existing middleware and routes... 

// Catch-all route for SPA - serve actual files if they exist, otherwise index.html
app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const filePath = path.join(__dirname, req.path);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});
const app = require('./src/app');

// For Vercel serverless functions, we export the app
// For local development, we can still run the server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export the app for Vercel
module.exports = app;
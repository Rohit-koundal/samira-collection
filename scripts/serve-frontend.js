const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const buildDir = path.join(__dirname, '..', 'build');
const indexFile = path.join(buildDir, 'index.html');
const port = Number(process.env.PORT || process.env.SERVER_PORT || 3000);

if (!fs.existsSync(indexFile)) {
  console.error('Frontend build is missing. Run npm run build first.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use(express.static(buildDir, {
  index: false,
  maxAge: '1y',
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html') || filePath.endsWith('404.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(indexFile);
});

app.listen(port, () => {
  console.log(`Samira storefront serving SPA on port ${port}`);
});

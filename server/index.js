const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const playlistRoutes = require('./routes/playlistRoutes');
const downloadRoutes = require('./routes/downloadRoutes');

app.use('/api/playlist', playlistRoutes);
app.use('/api/download', downloadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// server.js
import express from 'express';
const app = express();
const port = 2003;

app.get('/', (req, res) => {
  res.send('WhatsApp Bot is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { app };
const express = require('express');
const server = express();
const path = require('path');
const port = 5555;

server.use(express.static('.'));

server.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, './example.html'));
});

server.get('/hotels', (req, res) => {
	res.sendFile(path.resolve(__dirname, './example.html'));
});

server.listen(port);

console.log(`Server is running on http://localhost:${port}`);

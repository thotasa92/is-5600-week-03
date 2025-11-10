// app.js

// --- IMPORTS ---
const express = require('express');
const path = require('path');
const EventEmitter = require('events');

// --- APP SETUP ---
const port = process.env.PORT || 3000;
const app = express();

// Serve static files (like public/chat.js)
app.use(express.static(__dirname + '/public'));

// --- EVENT EMITTER FOR CHAT ---
const chatEmitter = new EventEmitter();

// --- ROUTE HANDLERS ---

/**
 * Responds with plain text
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function respondText(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.end('hi');
}

/**
 * Responds with JSON
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function respondJson(req, res) {
  // express has a built in json method that will set the content type header
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

/**
 * Responds with the input string in various formats
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function respondEcho(req, res) {
  // req.query is an object that contains the query parameters
  const { input = '' } = req.query;

  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

/**
 * Serves up the chat.html file
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, '/chat.html'));
}

/**
 * Responds to incoming chat messages and emits them to all clients
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function respondChat(req, res) {
  const { message } = req.query;
  console.log("New chat message:", message);
  chatEmitter.emit('message', message);
  res.end();
}

/**
 * Streams messages to clients using Server-Sent Events
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });

  const onMessage = message => res.write(`data: ${message}\n\n`);
  chatEmitter.on('message', onMessage);

  res.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
}

/**
 * Responds with a 404 not found
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 */
function respondNotFound(req, res) {
  res.status(404).send('Not Found');
}

// --- ROUTE REGISTRATION ---
app.get('/', chatApp);
app.get('/json', respondJson);
app.get('/echo', respondEcho);
app.get('/chat', respondChat);
app.get('/sse', respondSSE);

// fallback route
app.use(respondNotFound);

// --- START SERVER ---
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

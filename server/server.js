const express = require('express');
const cluster = require('cluster');
const os = require('os');
const net = require('net');
const socketio = require('socket.io');
const io_redis = require('socket.io-redis');
const farmhash = require('farmhash');

const socketLogic = require('./socketLogic');


const port = 8181;
const num_processes = os.cpus().length;


if (cluster.isMaster) {
	let workers = [];

	let spawn = function(i) {
		workers[i] = cluster.fork();

		// Restart worker on exit
		workers[i].on('exit', function(code, signal) {
			spawn(i);
		});
  };

	for (var i = 0; i < num_processes; i++) {
		spawn(i);
	}

	const worker_index = function(ip, len) {
		return farmhash.fingerprint32(ip) % len;
	};

	const server = net.createServer({ pauseOnConnect: true }, connection => {
		let worker = workers[worker_index(connection.remoteAddress, num_processes)];
		worker.send('sticky-session:connection', connection);
  });

  server.listen(port);
  console.log(`Master listening on port ${port}`);
} else {
  let app = express();
  // We don't use a port here because the master listens on it for us.
	// Don't expose our internal server to the outside world.
  const server = app.listen(0, 'localhost');
	const io = socketio(server);

	io.adapter(io_redis({ host: 'localhost', port: 6379 }));

  io.on('connection', function(socket) {
    socketLogic(io, socket);
    console.log(`Connected to worker ${cluster.worker.id}`);
  });

	// Listen to messages sent from the master by this line of code worker.send('sticky-session:connection', connection);
	process.on('message', function(message, connection) {
		if (message !== 'sticky-session:connection') {
			return;
		}

		server.emit('connection', connection);

		connection.resume();
	});
}
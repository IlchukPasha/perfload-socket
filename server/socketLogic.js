const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/perf-data?authSource=admin', { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: 'root',
  pass: 'root'
});

const Machine = require('./models/Machine');


function socketLogic(io, socket) {
  console.log('hello in socket');
  let macA;

  socket.on('clientAuth', key => {
    if (key === 'node-client-key') {
      socket.join('clients');
    } else if (key === 'react-key') {
      socket.join('ui');
      Machine.find({}, (err, docs) => {
        docs.forEach(aMachine => {
          aMachine.isActive = false;
          io.to('ui').emit('data', aMachine);
        });
      });
    } else {
      socket.disconnect(true);
    }
  });

  socket.on('disconnect',() => {
    Machine.find({ macA: macA },(err, docs) => {
      if (docs.length > 0) {
        docs[0].isActive = false;
        io.to('ui').emit('data', docs[0]);
      }
    });
  });

  socket.on('initPerfData', async data => {
    macA = data.macA
    await checkAndAdd(data);
  });

  socket.on('perfData', data => {
    console.log("Tick...");
    io.to('ui').emit('data', data);
  });
}

function checkAndAdd(data) {
  return new Promise((resolve, reject) => {
    Machine.findOne(
      { macA: data.macA },
      (err, doc) => {
        if (err) {
          reject(err);
        } else if (doc === null) {
          let machine = new Machine(data);
          machine.save();
          resolve();
        } else {
          resolve();
        }
      }
    );
  });
}

module.exports = socketLogic;

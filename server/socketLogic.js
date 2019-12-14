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

  socket.on('initPerfData', async data => {
    await checkAndAdd(data);
  });

  socket.on('perfData', data => {
    console.log("Tick...");
  });
}

function checkAndAdd(data){
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
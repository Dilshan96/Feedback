const config = require('config');

const host = config.get('database.host');
const port = config.get('database.port');
const database_name = config.get('database.name');
//const connecturl = `mongodb://${host}:${port}/${database_name}`
// const connecturl = "mongodb://localhost:27017/labayi" // `mongodb://${host}:${port}/${database_name}`
const connecturl = config.get('database.db_url');
console.log(connecturl);
const mongoose = require('mongoose');

mongoose
  .connect(connecturl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB...');
  })
  .catch(() => {
    console.log('MongoDB connection failed...');
  });

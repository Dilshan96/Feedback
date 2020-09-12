const debug = require('debug')('app:startup');
const config = require('config');
const morgan = require('morgan');
const express = require('express');
const app = express();
const cors = require('./middleware/cors');
require('./db/init.js');

app.use(cors);
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('upload'));

require('./startup/prod')(app);

//routers
initRoute('user');
initRoute('auth');

if (!config.get('jwtPrivateKey')) {
  console.error('Private key has not set');
  process.exit();
}

if (getEnviornment() == 'development') app.use(morgan('tiny'));

const port = getPort();
app.listen(port, () => console.log(`Listening in port ${port}`));

function getPort() {
  return process.env.PORT || config.get('system.port');
}

function getEnviornment() {
  return app.get('env');
}

function initRoute(url) {
  const mod = require(`./routes/${url}`);
  app.use(`/api/${url}`, mod);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS, PUT'
  );
  next();
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const dotenv = require('dotenv');
const port = 5000;

dotenv.config();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
// app.use(cors({credentials:true, origin:'http://localhost:3000'}));

const appRoute = require('./src/routes/route-auth');
app.use('/', appRoute);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
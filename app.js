var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const fs = require('fs');
const uuid = require('node-uuid');

//TRABALHO
const storageService = require('./services/StorageService');
let StorageService = new storageService();
let bucket = StorageService.createBucket("computacaoemnuvem"+uuid.v4());
bucket.then(async bucketService => {
    await bucketService.listBuckets()
    // for (let i = 0; i < 5; i++) {
    //     const path = './public/';
    //     let fileName = 'index'+i+'.html';
    //     let fileStream = fs.createReadStream(path+fileName);
    //     await bucketService.uploadFile(fileName, fileStream, fileStream.readableLength);
    // }
    // console.log("Carga Inicial de Dados concluída!");
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;

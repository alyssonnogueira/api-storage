const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const timeout = require('connect-timeout');

const bucketController = require('./controllers/BucketController');
const fileController = require('./controllers/FileController');
const testController = require('./controllers/TestController');

var app = express();

const fs = require('fs');
const uuid = require('node-uuid');

//INICIANDO SISTEMA
const BucketService = require('./services/BucketService');
const FileService = require('./services/FileService');
const bucketService = new BucketService();
const fileService = new FileService();
const NUMERO_DE_ARQUIVOS = 5;
// console.log("Criando Bucket Inicial");
// bucketService.createBucket("computacaoemnuvem").then(async bucketName => {
//     console.log("Inserindo Carga Inicial de Arquivos");
//     for (let i = 0; i < NUMERO_DE_ARQUIVOS; i++){
//         console.log(`Upload ${i+1} de ${NUMERO_DE_ARQUIVOS}`);
//         const path = './upload/';
//         let fileName = 'index'+i+'.html';
//         let fileStream = fs.createReadStream(path+fileName);
//         await fileService.uploadFile(bucketName, fileName, fileStream);
//     }
//     console.log("Carga Inicial de Dados concluída!");
// });

app.use(timeout('2400s'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bucket/', bucketController);
app.use('/file/', fileController);
app.use('/test/', testController);

module.exports = app;


const router = require('express').Router();
const fs = require("fs");
const BucketService = require('../services/BucketService');
const bucketService = new BucketService();
const FileService = require('../services/FileService');
const fileService = new FileService();
const RedisService = require('../services/RedisService');
const redisService = new RedisService();

const wrapper = fn => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };

"use strict";

const bucketCreationTime = [];
const textFileUploadTime = [];
const textFileAccessTime = [];
const textFileAccessTimeRedis = [];
const imageFileUploadTime = [];
const imageFileAccessTime = [];
const imageFileAccessTimeRedis = [];
const infoFileAccessTime = [];
const infoFileAccessTimeRedis = [];
const deleteFileTime = [];
const deleteFileTimeRedis = [];
const bucketDeleteTime = [];

class TestController {

    static async index(req, res) {
        return res.status(200).send({success:true, data: "Application Test Online"});
    };

    static async stressTest(req, res){
        console.log("Iniciando Teste de Stress");

        res.status(200).send({
            status: true,
            response: "Teste de Stress Iniciado!"
        });

        let startTime = 0;
        let endTime = 0;
        let bucket = 'cn-stress-test';
        //Criar Bucket para o Teste e coletar tempo
        console.log("Criando Bucket");
        startTime = new Date();
        await bucketService.createBucket(bucket);
        endTime = new Date();
        let creationTime = (new Date(endTime - startTime)).getMilliseconds();
        bucketCreationTime.push(creationTime);
        console.log(`Criou bucket em ${creationTime} MilliSegundos`);

        const NUMBER_OF_FILES = 10;
        const READ_TIMES = 10;
        let path = './download/';

        console.log("Iniciando Upload de Arquivos");
        await TestController.getTimeUpload(NUMBER_OF_FILES, fileService, textFileUploadTime, bucket,
            'index', 'html');
        await TestController.getTimeUpload(NUMBER_OF_FILES, fileService, imageFileUploadTime, bucket,
            'thecrew', 'jpg');

        console.log("Iniciando Download de Arquivos no S3");
        await TestController.getTimeAccess(NUMBER_OF_FILES, fileService, textFileAccessTime, bucket, 'index',
            'html', READ_TIMES);
        await TestController.getTimeAccess(NUMBER_OF_FILES, fileService, imageFileAccessTime, bucket, 'thecrew',
            'jpg', READ_TIMES);

        console.log("Iniciando Download de Arquivos com S3 + Redis");
        await TestController.getTimeAccessWithRedis(NUMBER_OF_FILES, fileService, textFileAccessTimeRedis,
            bucket, 'index','html', READ_TIMES);
        await TestController.getTimeAccessWithRedis(NUMBER_OF_FILES, fileService, imageFileAccessTimeRedis,
            bucket, 'thecrew','jpg', READ_TIMES);

        console.log("Iniciando acesso a informacoes dos Arquivos no S3");
        await TestController.getTimeInfoAccess(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'index', 'html');
        await TestController.getTimeInfoAccess(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'thecrew', 'jpg');

        console.log("Iniciando acesso a informacoes dos Arquivos no S3 + Redis");
        await TestController.getTimeInfoAccessWithRedis(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'index', 'html');
        await TestController.getTimeInfoAccessWithRedis(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'thecrew', 'jpg');

        console.log("Iniciando exclusão dos Arquivos no S3");
        await TestController.getTimeDeleteFile(NUMBER_OF_FILES, fileService, deleteFileTime, bucket,
            'index', 'html');
        await TestController.getTimeDeleteFile(NUMBER_OF_FILES, fileService, deleteFileTime, bucket,
            'thecrew', 'jpg');

        console.log("Iniciando Upload de Arquivos Novamente");
        await TestController.getTimeUpload(NUMBER_OF_FILES, fileService, [], bucket,
            'index', 'html');
        await TestController.getTimeUpload(NUMBER_OF_FILES, fileService, [], bucket,
            'thecrew', 'jpg');

        console.log("Iniciando exclusão dos Arquivos no S3 + Redis");
        await TestController.getTimeDeleteFileRedis(NUMBER_OF_FILES, fileService, deleteFileTimeRedis, bucket,
            'index', 'html');
        await TestController.getTimeDeleteFileRedis(NUMBER_OF_FILES, fileService, deleteFileTimeRedis, bucket,
            'thecrew', 'jpg');

        //Deletar Bucket e coletar tempo de resposta
        console.log("Deletando Bucket");
        startTime = new Date();
        await bucketService.deletarBucket(bucket);
        endTime = new Date();
        let deleteTime = (new Date(endTime - startTime)).getMilliseconds();
        bucketDeleteTime.push(deleteTime);
        console.log(`Excluiu bucket em ${deleteTime} MilliSegundos`);

        let fileStreamText = fs.createReadStream(path+'index0.html');
        let fileStreamImage = fs.createReadStream(path+'thecrew.jpg');
        let response = TestController.getObjetoDeRetorno(NUMBER_OF_FILES, fileStreamText.readableLength, NUMBER_OF_FILES,
            fileStreamImage.readableLength);
        console.log(response);
        return await redisService.setKey('response', response);
    }

    static async getResponseTest(req, res){
        const response = await redisService.getKey("response");
        return res.status(200).send(response);
    }

    static async getTimeUpload(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            // console.log(`Upload ${i+1} de ${iterations}`);
            let fileStream = fs.createReadStream(`./download/${fileName}0.${extension}`);
            let startTime = new Date();
            await fileService.uploadFile(bucket, `${fileName}${i}.${extension}`, fileStream, fileStream.readableLength);
            let endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - Upload em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeAccess(iterations, fileService, vectorTime, bucket, fileName, extension, readTimes){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            for (let j = 0; j < readTimes; j++) {
                await fileService.downloadFile(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            const accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Downloads em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeInfoAccess(iterations, fileService, vectorTime, bucket, fileName, extension, readTimes){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            for (let j = 0; j < readTimes; j++) {
                await fileService.getInfoFile(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Acessos em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeAccessWithRedis(iterations, fileService, vectorTime, bucket, fileName, extension, readTimes){
        for (let i = 0; i < iterations; i++) {
            // console.log(`Acessando ${i+1} de ${iterations} com REDIS`);
            const startTime = new Date();
            for (let j = 0; j < readTimes; j++) {
                await fileService.downloadFileRedis(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Downloads em ${accessTime} MiliSegundos com REDIS`);
        }
    }

    static async getTimeInfoAccessWithRedis(iterations, fileService, vectorTime, bucket, fileName, extension, readTimes){
        for (let i = 0; i < iterations; i++) {
            // console.log(`Acessando ${i+1} de ${iterations} com REDIS`);
            const startTime = new Date();
            for (let j = 0; j < readTimes; j++) {
                await fileService.getInfoFileRedis(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Acessos em ${accessTime} MiliSegundos com REDIS`);
        }
    }

    static async getTimeDeleteFile(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            await fileService.deleteFile(bucket, `${fileName}${i}.${extension}`);
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - Exclusão em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeDeleteFileRedis(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            await fileService.deleteFileRedis(bucket, `${fileName}${i}.${extension}`);
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - Exclusão em ${accessTime} MiliSegundos`);
        }
    }

    static getObjetoDeRetorno(numeroDeArquivosDeTexto, tamArquivosText, numeroDearquivosDeImagem, tamArquivosImagem){
        const textFileTotalTime = textFileUploadTime.reduce((a, b) => a + b, 0);
        const averageTextFileUpload = textFileTotalTime / textFileUploadTime.length;
        const textFileAccessTotalTime = textFileAccessTime.reduce((a, b) => a + b, 0);
        const averageTextFileAccessTotalTime = textFileAccessTotalTime / textFileAccessTime.length;
        const textFileAccessTotalTimeRedis = textFileAccessTimeRedis.reduce((a, b) => a + b, 0);
        const averageTextFileAccessTotalTimeRedis = textFileAccessTotalTimeRedis / textFileAccessTimeRedis.length;
        const infoFileTotalTime = infoFileAccessTime.reduce((a, b) => a + b, 0);
        const averageInfoFileAccessTotalTime = infoFileTotalTime / infoFileAccessTime.length;
        const infoFileTotalTimeRedis = infoFileAccessTimeRedis.reduce((a, b) => a + b, 0);
        const averageInfoFileAccessTotalTimeRedis = infoFileTotalTimeRedis / infoFileAccessTimeRedis.length;

        const imageFileTotalTime = imageFileUploadTime.reduce((a, b) => a + b, 0);
        const averageImageFileUpload = imageFileTotalTime / imageFileUploadTime.length;
        const imageFileAccessTotalTime = imageFileAccessTime.reduce((a, b) => a + b, 0);
        const averageImageFileAccessTotalTime = imageFileAccessTotalTime / imageFileAccessTime.length;
        const imageFileAccessTotalTimeRedis = imageFileAccessTimeRedis.reduce((a, b) => a + b, 0);
        const averageImageFileAccessTotalTimeRedis = imageFileAccessTotalTimeRedis / imageFileAccessTimeRedis.length;

        const deleteFileTotalTime = deleteFileTime.reduce((a, b) => a + b, 0);
        const averageDeleteTotalTime = deleteFileTotalTime / deleteFileTime.length;
        const deleteFileTotalTimeRedis = deleteFileTimeRedis.reduce((a, b) => a + b, 0);
        const averageDeleteTotalTimeRedis = deleteFileTotalTimeRedis / deleteFileTotalTimeRedis.length;

        return {

            TempoCriacaoBucket: bucketCreationTime,

            TemposUploadArquivoTexto: textFileUploadTime,
            MediaUploadArquivoTexto: averageTextFileUpload,
            TempoTotalUploadTexto: textFileTotalTime,
            TemposUploadArquivoImagem: imageFileUploadTime,
            MediaUploadArquivoImagem: averageImageFileUpload,
            TempoTotalUploadImagem: imageFileTotalTime,

            TemposDeAcessoArquivoTexto: textFileAccessTime,
            TempoTotalDeAcessoArquivoTexto: textFileAccessTotalTime,
            MediaTempoDeAcessoArquivoTexto: averageTextFileAccessTotalTime,
            TemposDeAcessoArquivoTextoRedis: textFileAccessTimeRedis,
            TempoTotalDeAcessoArquivoTextoRedis: textFileAccessTotalTimeRedis,
            MediaTempoDeAcessoArquivoTextoRedis: averageTextFileAccessTotalTimeRedis,

            TemposDeAcessoArquivoImagem: imageFileAccessTime,
            TempoTotalDeAcessoArquivoImagem: imageFileAccessTotalTime,
            MediaTempoDeAcessoArquivoImagem: averageImageFileAccessTotalTime,
            TemposDeAcessoArquivoTextoImagem: imageFileAccessTimeRedis,
            TempoTotalDeAcessoArquivoImagemRedis: imageFileAccessTotalTimeRedis,
            MediaTempoDeAcessoArquivoImagemRedis: averageImageFileAccessTotalTimeRedis,

            TemposDeAcessoInfoArquivos: infoFileTotalTime,
            TempoTotalDeAcessoInfoArquivos: infoFileTotalTime,
            MediaTempoDeAcessoInfoArquivos: averageInfoFileAccessTotalTime,
            TemposDeAcessoInfoArquivosRedis: infoFileAccessTimeRedis,
            TempoTotalDeAcessoInfoArquivosRedis: infoFileTotalTimeRedis,
            MediaTempoDeAcessoInfoArquivosRedis: averageInfoFileAccessTotalTimeRedis,

            TemposDeExclusaoDosArquivos: deleteFileTime,
            TempoTotalDeExclusaoDosArquivos: deleteFileTotalTime,
            MediaTempoDeExclusaoDosArquivos: averageDeleteTotalTime,
            TemposDeExclusaoDosArquivosRedis: deleteFileTotalTimeRedis,
            TempoTotalDeExclusaoDosArquivosRedis: deleteFileTotalTimeRedis,
            MediaTempoDeExclusaoDosArquivosRedis: averageDeleteTotalTimeRedis,

            TotalArquivosUsados: numeroDeArquivosDeTexto + numeroDearquivosDeImagem,
            NumeroDeArquivosDeTexto: numeroDeArquivosDeTexto,
            TamanhoArquivosText: tamArquivosText,
            NumeroDearquivosDeImagem: numeroDearquivosDeImagem,
            TamanhoArquivosImagem: tamArquivosImagem,

            TempoDeleteBucket: bucketDeleteTime
        }
    }
}

router.get('', wrapper(TestController.index));
router.get('/stress', wrapper(TestController.stressTest));
router.get('/stress/response', wrapper(TestController.getResponseTest));

module.exports = router;
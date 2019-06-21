
const router = require('express').Router();
const fs = require("fs");
const BucketService = require('../services/BucketService');
const bucketService = new BucketService();
const FileService = require('../services/FileService');
const fileService = new FileService();

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

        const NUMBER_OF_FILES = 4;
        let path = './upload/';
        //Upload 40 arquivos de texto
        let fileNameText = 'index0.html';
        let fileStreamText = fs.createReadStream(path+fileNameText);
        const uploadText = TestController.getTimeUpload(NUMBER_OF_FILES, fileService, textFileUploadTime, bucket,
            'index', 'html', fileStreamText);

        path = './download/';
        let fileNameImage = 'thecrew.jpg';
        let fileStreamImage = fs.createReadStream(path+fileNameImage);
        const uploadImage = TestController.getTimeUpload(NUMBER_OF_FILES, fileService, imageFileUploadTime, bucket,
            'thecrew', 'jpg', fileStreamImage);

        console.log("Iniciando Upload de Arquivos");
        await Promise.all([uploadText, uploadImage]);

        //Download de Arquivos
        const accessText = TestController.getTimeAccess(NUMBER_OF_FILES, fileService, textFileAccessTime, bucket, 'index',
            'html');
        const accessImage = TestController.getTimeAccess(NUMBER_OF_FILES, fileService, imageFileAccessTime, bucket, 'thecrew',
            'jpg');
        console.log("Iniciando Download de Arquivos no S3");
        await Promise.all([accessText, accessImage]);

        //Download de Arquivo Com Redis
        const accessTextRedis = TestController.getTimeAccessWithRedis(NUMBER_OF_FILES, fileService, textFileAccessTimeRedis,
            bucket, 'index',
            'html');
        const accessImageRedis = TestController.getTimeAccessWithRedis(NUMBER_OF_FILES, fileService, imageFileAccessTimeRedis,
            bucket, 'thecrew',
            'jpg');
        console.log("Iniciando Download de Arquivos com S3 + Redis");
        await Promise.all([accessTextRedis, accessImageRedis]);

        //Acessar cada informacao de arquivo 3 vezes e retirar o tempo médio sem Redis
        const accessInfoText = TestController.getTimeInfoAccess(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'index', 'html');
        const accessInfoImage = TestController.getTimeInfoAccess(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'thecrew', 'jpg');
        console.log("Iniciando acesso a informacoes dos Arquivos no S3");
        await Promise.all([accessInfoText, accessInfoImage]);

        //Acessar cada informacao de arquivo 3 vezes e retirar o tempo médio com Redis
        const accessInfoTextRedis = TestController.getTimeInfoAccessWithRedis(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'index', 'html');
        const accessInfoImageRedis = TestController.getTimeInfoAccessWithRedis(NUMBER_OF_FILES, fileService, infoFileAccessTime, bucket,
            'thecrew', 'jpg');
        console.log("Iniciando acesso a informacoes dos Arquivos no S3 + Redis");
        await Promise.all([accessInfoTextRedis, accessInfoImageRedis]);

        //Deletar todos os arquivos (apenas no S3) e coletar tempo médio
        const deleteTextFiles = TestController.getTimeDeleteFile(NUMBER_OF_FILES, fileService, deleteFileTime, bucket,
            'index', 'html');
        const deleteImageFiles = TestController.getTimeDeleteFile(NUMBER_OF_FILES, fileService, deleteFileTime, bucket,
            'thecrew', 'jpg');
        console.log("Iniciando exclusão dos Arquivos no S3");
        await Promise.all([deleteTextFiles, deleteImageFiles]);

        //Upload dos 80 arquivos
        const uploadText2 = TestController.getTimeUpload(NUMBER_OF_FILES, fileService, textFileUploadTime, bucket,
            'index', 'html', fileStreamText);
        const uploadImage2 = TestController.getTimeUpload(NUMBER_OF_FILES, fileService, imageFileUploadTime, bucket,
            'thecrew', 'jpg', fileStreamImage);
        console.log("Iniciando Upload de Arquivos Novamente");
        await Promise.all([uploadText2, uploadImage2]);

        //Deletar todos os arquivos do S3 + Redis e coletar tempo médio
        const deleteTextFilesRedis = TestController.getTimeDeleteFileRedis(NUMBER_OF_FILES, fileService, deleteFileTimeRedis, bucket,
            'index', 'html');
        const deleteImageFilesRedis = TestController.getTimeDeleteFileRedis(NUMBER_OF_FILES, fileService, deleteFileTimeRedis, bucket,
            'thecrew', 'jpg');
        console.log("Iniciando exclusão dos Arquivos no S3 + Redis");
        await Promise.all([deleteTextFilesRedis, deleteImageFilesRedis]);

        //Deletar Bucket e coletar tempo de resposta
        console.log("Deletando Bucket");
        startTime = new Date();
        //await bucketService.deletarBucket(bucket);
        endTime = new Date();
        let deleteTime = (new Date(endTime - startTime)).getMilliseconds();
        bucketDeleteTime.push(deleteTime);
        console.log(`Excluiu bucket em ${deleteTime} MilliSegundos`);

        let retorno = TestController.getObjetoDeRetorno(NUMBER_OF_FILES, fileStreamText.readableLength, NUMBER_OF_FILES,
            fileStreamImage.readableLength);
        console.log(retorno);
        return res.status(200).send(retorno);
    }

    static async getTimeUpload(iterations, fileService, vectorTime, bucket, fileName, extension, fileStream){
        for (let i = 0; i < iterations; i++) {
            // console.log(`Upload ${i+1} de ${iterations}`);
            const startTime = new Date();
            await fileService.uploadFile(bucket, `${fileName}${i}.${extension}`, fileStream, fileStream.readableLength);
            const endTime = new Date();
            const accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - Upload em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeAccess(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            for (let j = 0; j < 3; j++) {
                await fileService.downloadFile(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            const accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Downloads em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeInfoAccess(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            for (let j = 0; j < 3; j++) {
                await fileService.getInfoFile(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Acessos em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeAccessWithRedis(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            // console.log(`Acessando ${i+1} de ${iterations} com REDIS`);
            const startTime = new Date();
            for (let j = 0; j < 3; j++) {
                await fileService.downloadFileRedis(bucket, `${fileName}${i}.${extension}`);
            }
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - 3 Downloads em ${accessTime} MiliSegundos com REDIS`);
        }
    }

    static async getTimeInfoAccessWithRedis(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            // console.log(`Acessando ${i+1} de ${iterations} com REDIS`);
            const startTime = new Date();
            for (let j = 0; j < 3; j++) {
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
            //await fileService.deleteFile(bucket, `${fileName}${i}.${extension}`);
            const endTime = new Date();
            let accessTime = (new Date(endTime - startTime)).getMilliseconds();
            vectorTime.push(accessTime);
            console.log(`${fileName}${i}.${extension} - Exclusão em ${accessTime} MiliSegundos`);
        }
    }

    static async getTimeDeleteFileRedis(iterations, fileService, vectorTime, bucket, fileName, extension){
        for (let i = 0; i < iterations; i++) {
            const startTime = new Date();
            //await fileService.deleteFileRedis(bucket, `${fileName}${i}.${extension}`);
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

    // Criar Bucket para o Teste e coletar tempo
    // Upload 40 arquivos de texto
    // Upload 40 arquivos de imagem
    // Coletar tempo de cada requisicao
    // Somar tempo total de todas as requisicoes
    // Tempo medio de upload para arquivos de texto
    // Tempo medio de upload para arquivos de imagem
    // Acessar cada arquivo 3 vezes e retirar o tempo médio sem Redis
    // Acessar cada arquivo 3 vezes e retirar o tempo médio com Redis
    // Acessar cada informacao de arquivo 3 vezes e retirar o tempo médio sem Redis
    // Acessar cada informacao de arquivo 3 vezes e retirar o tempo médio com Redis
    // Deletar todos os arquivos (apenas no S3) e coletar tempo médio
    // Upload dos 80 arquivos
    // Deletar todos os arquivos do S3 + Redis e coletar tempo médio
    // Deletar Bucket e coletar tempo de resposta
    // Retornar JSON com todas as informações

}

router.get('', wrapper(TestController.index));
router.get('/stress', wrapper(TestController.stressTest));

module.exports = router;
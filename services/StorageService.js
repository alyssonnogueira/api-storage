'use strict';
// const Minio = require('minio');
const AWS = require('aws-sdk');

module.exports = class StorageService{

    constructor(bucket) {
        // this.S3Client = new Minio.Client({
        //     endPoint: 'play.minio.io',
        //     port: 9000,
        //     useSSL: true,
        //     accessKey: 'Q3AM3UQ867SPQQA43P2F',
        //     secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
        // });

        // this.S3Client = new Minio.Client({
        //     endPoint:  's3.amazonaws.com',
        //     accessKey: '745802484335',
        //     secretKey: 'zGioxfZxlG6lzlVC5lSj73oDAdlyrWqpQqoAKEiE'
        // });
        this.S3Client = new AWS.S3();

        this.bucket = bucket;
    }

    async createBucket(bucketName){
        const params = {
            Bucket: bucketName
        };
        console.log("Criando Bucket:", bucketName);
        // const bucketExist = await this.bucketExists(bucketName);

        // if (bucketExist)
        //     return new StorageService(bucketName);

        const response = await this.S3Client.createBucket(bucketName); //, 'us-east-1'); //sa-east-1  us-east-1

        console.log("Bucket Criado");
        console.log(response);
        return new StorageService(bucketName);
    }

    async listBuckets(){ //converter para private com typescript
        const response = await this.S3Client.listBuckets();
        console.log(response.Buckets);
        return response;
    }

    async bucketExists(bucketName) {
        let exists = await this.S3Client.bucketExists(bucketName).catch(
            err => {
                console.log('Erro ao verificar se bucket existe!', err);
            }
        );

        if (exists){
            console.log('Bucket Existe!');
        } else {
            console.log('Bucket não existe');
        }
        return exists;
    }

    async deletarBucket(){
        return await this.S3Client.removeBucket(this.bucket).catch(err => {
            console.log("Erro ao deletar bucket", err);
        })
    }

    async uploadFile(fileName, fileStream, fileSize) {
        console.log("Realizando Upload de Arquivo");

        await this.S3Client.putObject(this.bucket, fileName, fileStream, fileSize);

        console.log("Upload Concluido com Sucesso!!");
        return true;

    }

    async downloadFile(fileName){
        let size = 0;
        await this.S3Client.getObject(this.bucket, fileName, function(err, dataStream) {
            if (err) {
                return console.log(err)
            }
            dataStream.on('data', function(chunk) {
                size += chunk.length
            });

            dataStream.on('end', function() {
                console.log('End. Total size = ' + size)
            });

            dataStream.on('error', function(err) {
                console.log(err)
            });
        });
    }

    getInfoFile(fileName){
        return this.S3Client.statObject(this.bucket, fileName);
    }

    async deleteFile(fileName){
        await this.S3Client.removeObject(this.bucket, fileName);

        console.log('Arquivo Removido com sucesso');
    }

    fileExists(fileName) {
        let stats = this.getInfoFile(fileName).catch(
            err => { console.log("Arquivo não encontrado"); }
        );

        return stats != null;
    }

};
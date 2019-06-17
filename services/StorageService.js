'use strict';

const fs = require("fs");

const AWS = require('aws-sdk');

module.exports = class StorageService{

    constructor(bucket) {

        this.S3Client = new AWS.S3();

        this.bucket = bucket;

        this.downloadPath = './download/'
    }

    async createBucket(bucketName){
        console.log("Criando Bucket:", bucketName);
        const bucketExist = await this.bucketExistsSecond(bucketName);

        if (bucketExist){
            console.log("buckets.js " + bucketName + " já existe");
            return new StorageService(bucketName);
        }
        const bucket = new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName
            };
            this.S3Client.createBucket(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                resolve(data);
            })
        });

        await bucket;

        console.log("Bucket Criado");
        return new StorageService(bucketName);
    }

    async listBuckets(){ //converter para private com typescript
        console.log("list Buckets");

        const buckets = new Promise((resolve, reject) => {
            const params = {};
            this.S3Client.listBuckets(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                if (data == null)
                    return resolve([]);

                const nameOfBuckets = data.Buckets.map(bucket => {
                    return bucket.Name
                });
                resolve(nameOfBuckets);
            });
        });

        return await buckets;
    }

    async bucketExists(bucketName) {
        const exists = new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName
            };
            console.log(params);
            this.S3Client.waitFor('bucketExists', params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                resolve(data);
            });
        });

        if (await exists){
            console.log('Bucket Existe!');
        } else {
            console.log('Bucket não existe');
        }
        return exists;
    }

    async bucketExistsSecond(bucketName) {

        const exists = (await this.listBuckets()).some(bucket => {
            return bucket === bucketName;
        });

        if (await exists){
            console.log('Bucket Existe!');
        } else {
            console.log('Bucket não existe');
        }
        return exists;
    }

    async deletarBucket(){
        console.log("Excluindo um Bucket");

        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucket
            };
            this.S3Client.deleteBucket(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                resolve(data);
            });
        });
    }

    async uploadFile(fileName, fileStream, fileSize) {
        console.log("Realizando Upload de Arquivo");

        if (await this.fileExists(fileName)) {
            console.log("Arquivo já existe!");
            return true;
        }

        const file = new Promise((resolve, reject) => {
            const params = {
                Body: fileStream,
                Bucket: this.bucket,
                Key: fileName
            };
            this.S3Client.putObject(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                resolve(data);
            });
        });
        await file;
        console.log("Upload Concluido com Sucesso!!");
        return true;
    }

    async downloadFile(fileName){
        let size = 0;
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucket,
                Key: fileName
            };
            this.S3Client.getObject(params, function (err, data) {
                if (err) {
                    reject(err);
                }
                console.log(data);
                fs.writeFile(`./download/${fileName}`, data.Body, function (err) {
                    if (err)
                        reject(err);
                    else resolve(data);
                })
            });
        });
    }

    listFiles(){
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucket
            };
            this.S3Client.listObjectsV2(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                resolve(data);
            });
        });
    }

    getInfoFile(fileName){
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucket,
                Prefix: fileName
            };
            this.S3Client.listObjectsV2(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                if (data != null && data.Contents != null && data.Contents.length > 0)
                    return resolve(data.Contents.map(file => {
                        if (file.Key === fileName)
                            return file
                    }));

                resolve(false);
            });
        });
    }

    async deleteFile(fileName){
        console.log("Excluindo um arquivo");
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucket,
                Key: fileName
            };
            this.S3Client.deleteObject(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                console.log('Arquivo Removido com sucesso');
                resolve(true);
            });
        });
    }

    fileExists(fileName) {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucket,
                Prefix: fileName
            };
            this.S3Client.listObjectsV2(params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                if (data != null && data.Contents != null && data.Contents.length > 0)
                    return resolve(data.Contents.some(file => { return file.Key === fileName }));

                resolve(false);
            });
        });
    }

};
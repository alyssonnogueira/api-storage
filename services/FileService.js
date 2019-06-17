'use strict';

const fs = require("fs");

const AWS = require('aws-sdk');

module.exports = class FileService{

    constructor() {
        this.S3Client = new AWS.S3();
        this.downloadPath = './download/'
    }

    async uploadFile(bucketName, fileName, fileStream, fileSize) {

        if (await this.fileExists(bucketName, fileName))
            return true;

        const fileUpload = new Promise((resolve, reject) => {
            const params = {
                Body: fileStream,
                Bucket: bucketName,
                Key: fileName
            };
            this.S3Client.putObject(params, (err, data) => {
                if (err){
                    reject(err);
                }
                resolve(data);
            });
        });
        await fileUpload;

        return true;
    }

    async downloadFile(bucketName, fileName){
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName,
                Key: fileName
            };

            this.S3Client.getObject(params, function (err, data) {
                if (err) {
                    return console.log(err)
                }
                console.log(data);
                resolve(data.Body);
            });
        });
    }

    listFiles(bucketName){
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName
            };
            this.S3Client.listObjectsV2(params, (err, data) => {
                if (err){
                    reject(err);
                }

                resolve(data);
            });
        });
    }

    getInfoFile(bucketName, fileName){
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName,
                Prefix: fileName
            };
            this.S3Client.listObjectsV2(params, (err, data) => {
                if (err){
                    reject(err);
                }

                if (data != null && data.Contents != null && data.Contents.length > 0)
                    return resolve(data.Contents.map(file => {
                        if (file.Key === fileName)
                            return file
                    }));

                resolve(false);
            });
        });
    }

    async deleteFile(bucketName, fileName){
        console.log("Excluindo um arquivo");
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName,
                Key: fileName
            };
            this.S3Client.deleteObject(params, (err, data) => {
                if (err){
                    reject(err);
                }

                console.log('Arquivo Removido com sucesso');
                resolve(true);
            });
        });
    }

    fileExists(bucketName, fileName) {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName,
                Prefix: fileName
            };
            this.S3Client.listObjectsV2(params, (err, data) => {
                if (err){
                    reject(err);
                }

                if (data != null && data.Contents != null && data.Contents.length > 0)
                    return resolve(data.Contents.some(file => { return file.Key === fileName }));

                resolve(false);
            });
        });
    }

};
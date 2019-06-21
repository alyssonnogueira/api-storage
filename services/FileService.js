'use strict';

const fs = require("fs");
const AWS = require('aws-sdk');
const RedisService = require('./RedisService');

module.exports = class FileService{

    constructor() {
        this.S3Client = new AWS.S3();
        this.downloadPath = './download/';
        this.redisService = new RedisService();
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
                // console.log(data);
                resolve(data.Body);
            });
        });
    }

    async downloadFileRedis(bucket, fileName){
        const key = `${bucket}:${fileName}:buffer`;
        const fileCache = await this.redisService.getKeyFile(key);
        if (fileCache != null) {
            // console.log("Cache Redis");
            return fileCache;
        }
        const file = await this.downloadFile(bucket, fileName);
        this.redisService.setKeyFile(key, file).then(result => { console.log("Redis Cache File")});
        // console.log(file);

        return file;
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

    async getInfoFileRedis(bucket, fileName){
        const key = `${bucket}:${fileName}:info`;
        const fileInfoCache = await this.redisService.getKeyFile(key);
        if (fileInfoCache != null) {
            // console.log("Cache Redis");
            return fileInfoCache;
        }
        const fileInfo = await this.getInfoFile(bucket, fileName);
        this.redisService.setKey(key, fileInfo).then(result => { console.log("Redis Cache File")});
        // console.log(fileInfo);

        return fileInfo;
    }

    async deleteFile(bucketName, fileName){
        // console.log("Excluindo um arquivo");
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName,
                Key: fileName
            };
            this.S3Client.deleteObject(params, (err, data) => {
                if (err){
                    reject(err);
                }

                // console.log('Arquivo Removido com sucesso');
                resolve(true);
            });
        });
    }

    async deleteFileRedis(bucket, fileName) {
        const keyInfo = `${bucket}:${fileName}:info`;
        const keyBuffer = `${bucket}:${fileName}:buffer`;
        this.redisService.deleteKey(keyInfo).then(cache => console.log("Info Delete From Cache"));
        this.redisService.deleteKey(keyBuffer).then(cache => console.log("Buffer Delete From Cache"));
        await this.deleteFile(bucket, fileName);
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
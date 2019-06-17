'use strict';

const AWS = require('aws-sdk');

module.exports = class BucketService{

    constructor() {
        this.S3Client = new AWS.S3();
    }

    async createBucket(bucketName){
        console.log("Criando Bucket:", bucketName);
        const bucketExist = await this.bucketExistsSecond(bucketName);

        if (bucketExist)
            return bucketName;

        const bucket = new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName
            };
            this.S3Client.createBucket(params, (err, data) => {
                if (err){
                    reject(err);
                }
                resolve(data);
            })
        });

        await bucket;

        console.log("Bucket Criado");
        return bucketName;
    }

    async listBuckets(){ //converter para private com typescript
        console.log("lista Buckets");

        const buckets = new Promise((resolve, reject) => {
            const params = {};
            this.S3Client.listBuckets(params, (err, data) => {
                if (err){
                    reject(err);
                }

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

            this.S3Client.waitFor('bucketExists', params, (err, data) => {
                if (err){
                    reject(err);
                }
                console.log(data);
                resolve(data);
            });
        });

        return exists;
    }

    async bucketExistsSecond(bucketName) {
        return (await this.listBuckets()).some(bucket => {
            return bucket === bucketName;
        });
    }

    async deletarBucket(bucketName){
        console.log("Excluindo um Bucket");

        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucketName
            };
            this.S3Client.deleteBucket(params, (err, data) => {
                if (err){
                    reject(err);
                }

                resolve(data);
            });
        });
    }

};
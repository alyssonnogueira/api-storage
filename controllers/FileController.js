
const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FileService = require('../services/FileService');
const fileService = new FileService();
// const RedisService = require('../services/RedisService');
// const redisService = new RedisService();
const wrapper = fn => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };

"use strict";

class FileController {

    static async index(req, res) {
        return res.status(200).send({success:true, data: "Application Online"});
    };

    static async upload(req, res){
        console.log(req.file);
        const file = await fileService.uploadFile(req.params.bucket, req.file.originalname, req.file.buffer);
        return res.status(200).send(file);
    }

    static async list(req, res){
        const fileList = await fileService.listFiles(req.params.bucket);
        return res.status(200).send(fileList);
    }

    static async download(req, res){
        const file = await fileService.downloadFile(req.params.bucket, req.params.file);
        console.log(file);
        res.attachment(req.params.file);
        return res.status(200).send(file);
    }

    static async info(req, res){
        const fileInfo = await fileService.getInfoFile(req.params.bucket, req.params.file);
        return res.status(200).send(fileInfo);
    }

    static async delete(req, res){
        await fileService.deleteFile(req.params.bucket, req.query.fileName);
        return res.status(200).send({success:true, data: true});
    }

    static async downloadRedis(req, res){
        // const key = `${req.params.bucket}:${req.params.file}:buffer`;
        // const fileCache = await redisService.getKeyFile(key);
        // if (fileCache != null) {
        //     console.log("Cache Redis");
        //     res.attachment(req.params.file);
        //     return res.status(200).send(fileCache);
        // }
        // const file = await fileService.downloadFile(req.params.bucket, req.params.file);
        // redisService.setKeyFile(key, file).then(result => { console.log("Redis Cache File")});
        // console.log(file);
        const file = await fileService.downloadFileRedis(req.params.bucket, req.params.file);
        res.attachment(req.params.file);
        return res.status(200).send(file);
    }

    static async infoRedis(req, res){
        // const key = `${req.params.bucket}:${req.params.file}:info`;
        // const fileInfoCache = await redisService.getKey(key);
        // if (fileInfoCache != null) {
        //     console.log("Cache Redis");
        //     return res.status(200).send(fileInfoCache);
        // }
        // redisService.setKey(key, fileInfo).then(result => { console.log("Redis Cache File")});

        const fileInfo = await fileService.getInfoFileRedis(req.params.bucket, req.params.file);

        return res.status(200).send(fileInfo);
    }

    static async deleteRedis(req, res){
        // const keyInfo = `${req.params.bucket}:${req.query.fileName}:info`;
        // const keyBuffer = `${req.params.bucket}:${req.query.fileName}:buffer`;
        // redisService.deleteKey(keyInfo).then(cache => console.log("Info Delete From Cache"));
        // redisService.deleteKey(keyBuffer).then(cache => console.log("Buffer Delete From Cache"));
        // await fileService.deleteFile(req.params.bucket, req.query.fileName);
        await fileService.deleteFileRedis(req.params.bucket, req.query.fileName);
        return res.status(200).send({success:true, data: true});
    }
}

router.get('/file', wrapper(FileController.index));
router.post('/:bucket', upload.single('file'), wrapper(FileController.upload));
router.get('/:bucket',  wrapper(FileController.list));
router.delete('/:bucket',  wrapper(FileController.delete));
router.get('/:bucket/:file',  wrapper(FileController.download));
router.get('/:bucket/:file/info',  wrapper(FileController.info));
//Rotas com Redis
router.delete('/:bucket/redis',  wrapper(FileController.deleteRedis));
router.get('/:bucket/:file/redis',  wrapper(FileController.downloadRedis));
router.get('/:bucket/:file/info/redis',  wrapper(FileController.infoRedis));

module.exports = router;

const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FileService = require('../services/FileService');
const fileService = new FileService();
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

    static async download(req, res){
        const file = await fileService.downloadFile(req.params.bucket, req.params.file);
        console.log(file);
        res.attachment(req.params.file);
        return res.status(200).send(file);
    }

    static async list(req, res){
        const fileList = await fileService.listFiles(req.params.bucket);
        return res.status(200).send(fileList);
    }

    static async info(req, res){
        const fileInfo = await fileService.getInfoFile(req.params.bucket, req.params.file);
        return res.status(200).send(fileInfo);
    }

    static async delete(req, res){
        await fileService.deletarBucket(req.params.bucket, req.query.fileName);
        return res.status(200).send({success:true, data: true});
    }
}

router.get('/file', wrapper(FileController.index));
router.post('/:bucket', upload.single('file'), wrapper(FileController.upload));
router.get('/:bucket',  wrapper(FileController.list));
router.delete('/:bucket',  wrapper(FileController.delete));
router.get('/:bucket/:file',  wrapper(FileController.download));
router.get('/:bucket/:file/info',  wrapper(FileController.info));

module.exports = router;
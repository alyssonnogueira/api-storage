const router = require('express').Router();
const BucketService = require('../services/BucketService');
const bucketService = new BucketService();
const wrapper = fn => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };

"use strict";

class BucketController {

    static async index(req, res) {
        return res.status(200).send({success:true, data: "Application Online"});
    };

    static async create(req, res){
        const bucket = await bucketService.createBucket(req.body.bucket);
        return res.status(200).send({bucket: bucket});
    }

    static async list(req, res){
        const bucketList = await bucketService.listBuckets();
        return res.status(200).send({ buckets: bucketList});
    }

    static async delete(req, res){
        await bucketService.deletarBucket(req.query.bucket);
        return res.status(200).send({success:true, data: true});
    }
}

const bucketController = new BucketController();

router.get('/bucket', wrapper(BucketController.index));
router.post('/',  wrapper(BucketController.create));
router.get('/',  wrapper(BucketController.list));
router.delete('/',  wrapper(BucketController.delete));

module.exports = router;
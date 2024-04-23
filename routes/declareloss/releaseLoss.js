var express = require('express');
var router = express.Router();
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' }); // 设置文件存储位置
var pool = require('../dbPool');
var fs = require('fs');

//发布挂失
router.post('/', upload.single('Image'), function(req, res) {
    const { LossItemName, username } = req.body;
    const Image = req.file ? fs.readFileSync(req.file.path) : null; // 读取图片文件
    console.log(username);
    console.log(LossItemName);
    console.log(Image);
    // 检查信息是否完整
    if (!LossItemName || !username ) {
        return res.status(400).json({ success: false, message: '请提供完整的商品信息' });
    }

    // 从数据库查询用户ID
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, results) {
        if (error) {
            return res.status(500).json({success: false, message: '查询user表错误'});
        }
        if (results.length === 0) {
            return res.status(401).json({success: false, message: '用户名不存在'});
        }
        else {
            const userID = results[0].userID;
            // 将商品信息插入Items表
            pool.query('INSERT INTO LossItems (LossItemName, userID, Image) VALUES (?, ?, ?)',
                [LossItemName, userID,Image], function(error, results) {
                    if (error) {
                        console.log(error);
                        return res.status(500).json({success: false, message: '插入releaseloss表错误'});
                    }
                    res.json({success: true, message: '挂失信息已成功入库'});
                });
        }
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 注册校园卡
router.post('/', function(req, res) {
    const { userName, cardNumber } = req.body; // 通过请求体传递userName和cardNumber

    //检查用户名和卡号是否被提供
    if (!userName || !cardNumber) {
        return res.status(400).json({ success: false, message: '必须提供用户名和卡号' });
    }

    // 查询用户是否存在
    pool.query('SELECT userID FROM user WHERE userName = ?', [userName], function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询user表错误' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: '未找到该用户名的用户' });
        }

        // 获取用户ID
        const userID = results[0].userID;

        // 查询校园卡是否已经注册
        pool.query('SELECT cardNumber FROM campuscards WHERE userID = ?', [userID], function(cardError, cardResults) {
            if (cardError) {
                return res.status(500).json({ success: false, message: '查询campuscards表错误' });
            }
            if (cardResults.length > 0) {
                return res.status(409).json({ success: false, message: '此用户的校园卡已经注册' });
            }

            // 插入新的校园卡记录
            pool.query('INSERT INTO campuscards (userID, cardNumber, balance, lostStatus) VALUES (?, ?, 0, FALSE)', [userID, cardNumber], function(insertError) {
                if (insertError) {
                    return res.status(500).json({ success: false, message: '插入campuscards表错误' });
                }
                res.json({ success: true, message: '校园卡注册成功' });
            });
        });
    });
});

module.exports = router;

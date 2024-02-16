var express = require('express');
var router = express.Router();
var pool = require('./dbPool'); // 使用同一个数据库连接池

// 校园卡挂失
router.post('/', function(req, res) {
    const { userName } = req.body; // 通过请求体传递userName
    console.log(userName);

    // 检查用户名是否被提供
    if (!userName) {
        return res.status(400).json({ success: false, message: '未提供用户名' });
    }

    // 首先，检查与该用户名关联的校园卡是否存在
    pool.query('SELECT campuscards.cardNumber, campuscards.lostStatus FROM campuscards JOIN user ON campuscards.userID = user.userID WHERE user.userName = ?', [userName], async function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '服务错误' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: '未找到与该用户名关联的校园卡账户' });
        }

        // 检查校园卡是否已经挂失
        if (results[0].lostStatus === 1) {
            return res.status(409).json({ success: false, message: '校园卡已经挂失' });
        }

        // 更新校园卡的挂失状态为1（挂失）
        pool.query('UPDATE campuscards JOIN user ON campuscards.userID = user.userID SET campuscards.lostStatus = 1 WHERE user.userName = ?', [userName], function(updateError) {
            if (updateError) {
                return res.status(500).json({ success: false, message: '挂失失败，服务出错' });
            }
            res.json({ success: true, message: '挂失成功' });
        });
    });
});

module.exports = router;

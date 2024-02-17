var express = require('express');
var router = express.Router();
var pool = require('../dbPool'); // 使用同一个数据库连接池

// 通过用户名查询校园卡账户信息
router.post('/', function(req, res) {
    const { userName } = req.body; // 通过请求体传递userName
    console.log(userName);

    // 从数据库查询校园卡账户信息
    // 使用userName联结user表和campuscards表
    pool.query('SELECT campuscards.cardNumber, campuscards.balance, campuscards.lostStatus FROM campuscards JOIN user ON campuscards.userID = user.userID WHERE user.userName = ?', [userName], function(error, results) {
        if (error) {
            // 数据库查询出错
            return res.status(500).json({success: false, message: '服务错误'});
        }
        if (results.length === 0) {
            // 未找到与该userName关联的校园卡账户
            return res.status(404).json({success: false, message: '未找到校园卡账户'});
        }

        // 查询成功，返回相关的校园卡账户信息
        res.json({
            success: true,
            message: "查询成功",
            data: results // 如果一个userName可能关联多个校园卡，这里返回一个数组
        });
    });
});

module.exports = router;

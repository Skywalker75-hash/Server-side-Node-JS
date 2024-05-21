var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 管理员登录
router.post('/', function(req, res) {
    const { managerName, mPwd } = req.body;  // 接收登录信息
    console.log(managerName, mPwd);

    // 查找管理员信息
    const sql = `
        SELECT * FROM manager WHERE managerName = ? AND mPwd = ?
    `;
    const values = [managerName, mPwd];

    pool.query(sql, values, function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '登录错误' });
        }
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
        // 登录成功，返回成功消息
        res.json({
            success: true,
            message: '登录成功'
        });
    });
});

module.exports = router;

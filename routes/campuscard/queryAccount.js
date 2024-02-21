var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//通过用户名查询校园卡账户
router.post('/', function(req, res) {
    const { userName } = req.body; // 通过请求体传递userName
    console.log(userName);
    // 检查信息是否完整
    if (!userName) {
        return res.status(400).json({ success: false, message: '请提供完整信息' });
    }
    //从campuscards表和user表查询校园卡账户信息
    pool.query('SELECT campuscards.cardNumber, campuscards.balance, campuscards.lostStatus FROM campuscards JOIN user ON campuscards.userID = user.userID WHERE user.userName = ?', [userName], function(error, results) {
        if (error) {
            return res.status(500).json({success: false, message: 'campuscards表user表查询错误'});
        }
        if (results.length === 0) {
            //未找到与该userName关联的校园卡账户
            return res.status(404).json({success: false, message: '该账户不存在'});
        }

        //存在账户，返回json数据包
        res.json({
            success: true,
            message: "查询成功",
            data: results
        });

    });
});

module.exports = router;

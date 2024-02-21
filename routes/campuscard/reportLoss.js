var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//校园卡挂失
router.post('/', function(req, res) {
    const { userName } = req.body; // 通过请求体传递userName
    console.log(userName);

    //检查用户名是否被提供
    if (!userName) {
        return res.status(400).json({ success: false, message: '未提供用户名' });
    }

    // 查询校园卡是否存在
    pool.query('SELECT campuscards.cardNumber, campuscards.lostStatus FROM campuscards JOIN user ON campuscards.userID = user.userID WHERE user.userName = ?', [userName], async function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询campuscards表和user表错误' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: '未找到与该用户名关联的校园卡账户' });
        }

        //检查校园卡是否已经挂失
        if (results[0].lostStatus === 1) {
            return res.status(409).json({ success: false, message: '校园卡已经挂失' });
        }
        else{
            //改变校园卡的挂失状态为
            pool.query('UPDATE campuscards JOIN user ON campuscards.userID = user.userID SET campuscards.lostStatus = 1 WHERE user.userName = ?', [userName], function(updateError) {
                if (updateError) {
                    return res.status(500).json({ success: false, message: '更新campuscards表错误' });
                }
                res.json({ success: true, message: '挂失成功' });
            });
        }
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//校园卡解挂
router.post('/', function(req, res) {
    const { userName } = req.body; // 通过请求体传递userName
    console.log(userName);
    // 检查信息是否完整
    if (!userName) {
        return res.status(400).json({ success: false, message: '请提供完整信息' });
    }
    //查询校园卡是否存在
    pool.query('SELECT campuscards.cardNumber, campuscards.lostStatus FROM campuscards JOIN user ON campuscards.userID = user.userID WHERE user.userName = ?', [userName], async function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询campuscards表错误' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: '未找到校园卡' });
        }

        //消炎卡没挂失
        if (results[0].lostStatus === 0) {
            return res.status(409).json({ success: false, message: '校园卡未挂失' });
        }
        else {
            //挂失校园卡
            pool.query('UPDATE campuscards JOIN user ON campuscards.userID = user.userID SET campuscards.lostStatus = 0 WHERE user.userName = ?', [userName], function (updateError) {
                if (updateError) {
                    return res.status(500).json({success: false, message: '解挂失败，服务出错'});
                }
                res.json({success: true, message: '解挂成功'});
            });
        }
    });
});

module.exports = router;

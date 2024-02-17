var express = require('express');
var router = express.Router();
var pool = require('../dbPool'); // 假设你已经创建了一个数据库连接池

// 校园卡充值
router.post('/', function(req, res) {
    const { userName, amount } = req.body; // 从请求体中获取用户名和充值金额
    console.log(userName, amount);

    // 检查用户名和金额是否被提供
    if (!userName || !amount) {
        return res.status(400).json({ success: false, message: '必须提供用户名和充值金额' });
    }

    // 首先，检查与该用户名关联的校园卡是否存在
    pool.query('SELECT userID FROM user WHERE userName = ?', [userName], function(err, userResult) {
        if (err) {
            console.error('Recharge Error:', err);
            return res.status(500).json({ success: false, message: '查询用户失败，服务出错' });
        }
        if (userResult.length === 0) {
            return res.status(404).json({ success: false, message: '未找到用户' });
        }
        const userID = userResult[0].userID;

        // 更新校园卡的余额
        pool.query('UPDATE campuscards SET balance = balance + ? WHERE userID = ?', [parseFloat(amount), userID], function(updateErr) {
            if (updateErr) {
                console.error('Recharge Error:', updateErr);
                return res.status(500).json({ success: false, message: '充值失败，服务出错' });
            }
            res.json({ success: true, message: '充值成功' });
        });
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//校园卡充值
router.post('/', function(req, res) {
    const { userName, amount } = req.body;
    console.log(userName, amount);

    //检查用户名和金额是否被提供
    if (!userName || !amount) {
        return res.status(400).json({ success: false, message: '必须提供用户名和充值金额' });
    }

    //查询校园卡是否存在
    pool.query('SELECT userID FROM user WHERE userName = ?', [userName], function(err, userResult) {

        if (err) {
            console.error('Recharge Error:', err);
            return res.status(500).json({ success: false, message: '查询user表出错' });
        }

        if (userResult.length === 0){
            return res.status(404).json({ success: false, message: '未找到用户' });
        }
        else
        {
            const userID = userResult[0].userID;
            // 更新校园卡的余额
            pool.query('UPDATE campuscards SET balance = balance + ? WHERE userID = ?', [parseFloat(amount), userID], function(updateErr) {
                if (updateErr) {
                    return res.status(500).json({ success: false, message: '更新campuscards表失败' });
                }
                res.json({ success: true, message: '充值成功' });
            });
        }
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var pool = require('../dbPool'); // 假设您已经有了一个配置好的数据库连接池

// 记录点击事件
router.post('/recordClick', function(req, res) {
    const { userID, itemID } = req.body;

    // 检查是否提供了必要的信息
    if (!userID || !itemID) {
        return res.status(400).json({ success: false, message: '请提供完整的点击信息' });
    }

    // 检查这个用户是否已经对这个物品有点击记录
    pool.query('SELECT InteractionID FROM UserItemInteractions WHERE userID = ? AND itemID = ?', [userID, itemID], function(error, results) {
        if (error) {
            return res.status(500).json({success: false, message: '查询UserItemInteractions表错误'});
        }
        if (results.length > 0) {
            // 如果已有点击记录，更新ClickCount
            const interactionID = results[0].InteractionID;
            pool.query('UPDATE UserItemInteractions SET ClickCount = ClickCount + 1 WHERE InteractionID = ?', [interactionID], function(error) {
                if (error) {
                    return res.status(500).json({success: false, message: '更新UserItemInteractions表错误'});
                }
                res.json({success: true, message: '点击计数已更新'});
            });
        } else {
            // 如果没有点击记录，插入新记录
            pool.query('INSERT INTO UserItemInteractions (userID, itemID, ClickCount) VALUES (?, ?, 1)', [userID, itemID], function(error) {
                if (error) {
                    return res.status(500).json({success: false, message: '插入UserItemInteractions表错误'});
                }
                res.json({success: true, message: '点击记录已成功入库'});
            });
        }
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//记录用户和商品的交互
router.post('/', function(req, res) {
    const {username, itemID} = req.body;

    //检查信息完整性
    if (!username || !itemID) {
        return res.status(400).json({success: false, message: '请提供完整的点击信息'});
    }
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function (err,ress) {
        if (err) {
            return res.status(500).json({success: false, message: '查询user表错误'});
        }
        if (ress.length === 0) {
            return res.status(401).json({success: false, message: '用户名不存在'});
        }
        const userID=ress[0].userID;
        //检查用户是否已对这个物品有点击
        pool.query('SELECT InteractionID FROM UserItemInteractions WHERE userID = ? AND itemID = ?', [userID, itemID], function (error, results) {
            if (error) {

                return res.status(500).json({success: false, message: '查询UserItemInteractions表错误'});
            }
            if (results.length > 0) {
                // 如果有记录
                const interactionID = results[0].InteractionID;
                pool.query('UPDATE UserItemInteractions SET ClickCount = ClickCount + 1 WHERE InteractionID = ?', [interactionID], function (error) {
                    if (error) {
                        return res.status(500).json({success: false, message: '更新UserItemInteractions表错误'});
                    }
                    res.json({success: true, message: '点击计数已更新'});
                });
            } else {
                // 如果没有记录
                pool.query('INSERT INTO UserItemInteractions (userID, itemID, ClickCount) VALUES (?, ?, 1)', [userID, itemID], function (error) {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({success: false, message: '插入UserItemInteractions表错误'});
                    }
                    res.json({success: true, message: '点击记录已成功入库'});
                });
            }
        });
    });
});
module.exports = router;

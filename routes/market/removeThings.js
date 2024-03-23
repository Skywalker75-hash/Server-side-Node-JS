var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//根据itemID和username验证并删除商品信息
router.post('/', function(req, res) {
    const { username, itemID } = req.body; // 从请求体中获取username和itemID

    if (!username || !itemID) {
        return res.status(400).json({ success: false, message: '请提供完整的username和itemID' });
    }

    // 首先，根据username查询user表获取userID
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, userResults) {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: '查询用户信息时发生错误', error: error.message });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: '未找到对应的用户' });
        }

        const userID = userResults[0].userID;

        // 然后，验证Items表中itemID对应的userID是否与当前用户匹配
        pool.query('SELECT userID FROM Items WHERE ItemID = ?', [itemID], function(error, itemResults) {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: '查询商品信息时发生错误', error: error.message });
            }

            if (itemResults.length === 0 || itemResults[0].userID !== userID) {
                return res.status(403).json({ success: false, message: '无权限删除此商品信息或商品不存在' });
            }

            // 如果用户匹配，执行删除操作
            const deleteQuery = 'DELETE FROM Items WHERE ItemID = ?';
            pool.query(deleteQuery, [itemID], function(error, deleteResult) {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, message: '删除商品信息时发生错误', error: error.message });
                }

                if (deleteResult.affectedRows > 0) {
                    res.json({
                        success: true,
                        message: '商品信息删除成功'
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        message: '未找到对应的商品信息，删除失败'
                    });
                }
            });
        });
    });
});

module.exports = router;

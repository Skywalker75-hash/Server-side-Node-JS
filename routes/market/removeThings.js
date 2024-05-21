var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 根据ItemID和username删除商品信息
router.post('/', function(req, res) {
    const { username, ItemID } = req.body;
    console.log(username);
    console.log(ItemID);
    if (!username || !ItemID) {
        return res.status(400).json({ success: false, message: '请提供完整的username和ItemID' });
    }


    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, userResults) {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: '查询用户信息时发生错误', error: error.message });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: '未找到对应的用户' });
        }

        const userID = userResults[0].userID;

        pool.query('SELECT userID FROM Items WHERE ItemID = ?', [ItemID], function(error, itemResults) {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: '查询商品信息时发生错误', error: error.message });
            }

            if (itemResults.length === 0 || itemResults[0].userID !== userID) {
                return res.status(403).json({ success: false, message: '无权限删除此商品信息或商品不存在' });
            }

            const deleteDependenciesQuery = 'DELETE FROM itemsimilarity WHERE item_id2 = ?';
            pool.query(deleteDependenciesQuery, [ItemID], function(error) {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, message: '删除依赖记录时发生错误', error: error.message });
                }

                const deleteQuery = 'DELETE FROM Items WHERE ItemID = ? AND userID = ?';
                pool.query(deleteQuery, [ItemID, userID], function(error, deleteResult) {
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
});

module.exports = router;

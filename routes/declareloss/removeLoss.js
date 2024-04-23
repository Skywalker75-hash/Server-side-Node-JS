var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 删除指定的挂失物品
router.post('/', function(req, res) {
    const { username, LossItemID } = req.body;

    // 检查必需的信息是否已提供
    if (!username || !LossItemID) {
        return res.status(400).json({ success: false, message: '请提供完整的用户名和挂失物品ID' });
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

        // 然后，验证LossItems表中LossItemID对应的userID是否与当前用户匹配
        pool.query('SELECT userID FROM LossItems WHERE LossItemID = ?', [LossItemID], function(error, lossItemResults) {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: '查询挂失物品信息时发生错误', error: error.message });
            }

            if (lossItemResults.length === 0 || lossItemResults[0].userID !== userID) {
                return res.status(403).json({ success: false, message: '无权限删除此挂失物品或挂失物品不存在' });
            }

            // 如果用户匹配，执行删除操作
            pool.query('DELETE FROM LossItems WHERE LossItemID = ?', [LossItemID], function(error, deleteResult) {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, message: '删除挂失物品时发生错误', error: error.message });
                }

                if (deleteResult.affectedRows > 0) {
                    res.json({
                        success: true,
                        message: '挂失物品删除成功'
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        message: '未找到对应的挂失物品，删除失败'
                    });
                }
            });
        });
    });
});

module.exports = router;

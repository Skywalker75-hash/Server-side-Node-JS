var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 根据username分页查询并显示挂失物品信息
router.post('/', function(req, res) {
    const { username, page, pageSize } = req.body; // 获取请求体中的分页信息
    const offset = (page - 1) * parseInt(pageSize); // 计算分页的偏移量，确保pageSize是数字

    if (!username) {
        return res.status(400).json({ success: false, message: '请提供username' });
    }

    // 首先根据username查询user表获取userID
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, userResults) {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: '查询user表错误' });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: '找不到该用户' });
        }

        const userID = userResults[0].userID;

        // 使用userID查询LossItems表获取挂失物品信息，并支持分页
        const query = `
            SELECT LossItems.LossItemID, LossItems.LossItemName, LossItems.Image, LossItems.Phone,
                   user.username AS userName 
            FROM LossItems 
            INNER JOIN user ON LossItems.userID = user.userID 
            WHERE LossItems.userID = ? 
            ORDER BY LossItems.LossItemID DESC 
            LIMIT ? OFFSET ?`;

        pool.query(query, [userID, parseInt(pageSize), offset], function(error, itemsResults) {
            if (error) {
                console.log(error);
                return res.status(500).json({ success: false, message: '查询LossItems表错误', error: error.message });
            }

            // 处理返回的图片数据，如果有图片则转换为Base64格式
            const processedResults = itemsResults.map(item => {
                if (item.Image) {
                    item.Image = `data:image/jpeg;base64,${Buffer.from(item.Image).toString('base64')}`;
                }
                return item;
            });

            res.json({
                success: true,
                message: '分页加载挂失物品信息成功',
                data: processedResults
            });
        });
    });
});

module.exports = router;

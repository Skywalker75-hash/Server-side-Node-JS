var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 根据username查询并显示商品信息，支持分页
router.post('/', function(req, res) {
    const { username, page, pageSize } = req.body; // 添加page和pageSize处理分页
    const offset = (page - 1) * pageSize; // 计算从哪个位置开始查询

    if (!username) {
        return res.status(400).json({ success: false, message: '请提供username' });
    }

    // 根据username查询user表获取userID
    pool.query('SELECT userID FROM user WHERE username = ?', [username], function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询user表错误' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: '找不到该用户' });
        }

        const userID = results[0].userID;

        // 使用userID查询Items表获取商品信息，并支持分页
        const query = `
            SELECT Items.ItemID, Items.ItemName, Items.Category, Items.Price, Items.Image, user.username AS userName 
            FROM Items 
            INNER JOIN user ON Items.userID = user.userID 
            WHERE Items.userID = ? 
            ORDER BY Items.ItemID DESC 
            LIMIT ? OFFSET ?`;

        pool.query(query, [userID, parseInt(pageSize), offset], function(error, itemsResults) {
            if (error) {
                return res.status(500).json({ success: false, message: '查询Items表错误', error: error.message });
            }

            const processedResults = itemsResults.map(item => {
                if (item.Image) {
                    // 假设图片存储为Buffer对象（二进制数据），将其转换为Base64字符串
                    item.Image = `data:image/jpeg;base64,${Buffer.from(item.Image).toString('base64')}`;
                }
                return item;
            });

            res.json({
                success: true,
                message: '分页加载物品及用户信息成功',
                data: processedResults
            });
        });
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

router.post('/', function(req, res) {
    const { username, page, pageSize } = req.body; // 接收前端传来的 username

    if (!username) {
        return res.status(400).json({ success: false, message: '缺少用户名参数' });
    }

    // 首先根据用户名查询用户ID
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(err, userResults) {
        if (err) {
            return res.status(500).json({ success: false, message: '查询用户ID失败', error: err.message });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: '未找到用户' });
        }
        const currentUserID = userResults[0].userID;

        const offset = (page - 1) * pageSize; // 从哪里开始获取结果
        // 修改查询，排除当前用户的物品
        pool.query(`
            SELECT 
                LossItems.LossItemID, LossItems.LossItemName, LossItems.userID, 
                LossItems.Image, user.userName AS userName
            FROM 
                LossItems 
            INNER JOIN 
                user ON LossItems.userID = user.userID
            WHERE 
                LossItems.userID != ? 
            ORDER BY 
                LossItems.LossItemID DESC 
            LIMIT ? OFFSET ?`,
            [currentUserID, parseInt(pageSize), offset], function(error, results, fields) {
                if (error) {
                    return res.status(500).json({ success: false, message: '查询LossItems表错误', error: error.message });
                }

                // 处理每个数据项，将图片的二进制数据转换为Base64字符串
                const processedResults = results.map(item => {
                    let itemCopy = {...item};

                    if (itemCopy.Image) {
                        // 假设图片存储为Buffer对象（二进制数据）
                        // 转换为Base64字符串
                        itemCopy.Image = Buffer.from(itemCopy.Image).toString('base64');
                        itemCopy.Image = `data:image/jpeg;base64,${itemCopy.Image}`; // 您可能需要根据实际图片格式调整MIME类型
                    }

                    return itemCopy;
                });

                //返回json数据包
                res.json({
                    success: true,
                    message: '分页加载挂失物品及用户信息成功',
                    data: processedResults
                });
            });
    });
});

module.exports = router;



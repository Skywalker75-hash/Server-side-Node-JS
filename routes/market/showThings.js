var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

router.post('/', function(req, res) {
    const { page, pageSize } = req.body;//page是第几页，pageSize是一页有几个数据项

    const offset = (page - 1) * pageSize;//从哪里开始获取结果

    //修改查询语句，加入user表的连接，获取userName
    pool.query(`
        SELECT 
            Items.ItemID, Items.ItemName, Items.userID, Items.Category, 
            Items.Price, Items.Image, user.userName AS userName
        FROM 
            Items 
        INNER JOIN 
            user ON items.userID = user.userID
        ORDER BY 
            Items.ItemID DESC 
        LIMIT ? OFFSET ?`,//LIMIT是获取数据项的数目，OFFSET是从哪里开始获取
        [parseInt(pageSize), offset], function(error, results, fields) {
            if (error) {
                return res.status(500).json({ success: false, message: '查询Items表错误', error: error.message });
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
                message: '分页加载物品及用户信息成功',
                data: processedResults
            });
        });
});

module.exports = router;


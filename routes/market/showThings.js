const express = require('express');
const router = express.Router();
const pool = require('../dbPool'); // 确保你已经设置了数据库连接池

//计算两个向量之间的余弦相似度
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        normA += Math.pow(vec1[i], 2);
        normB += Math.pow(vec2[i], 2);
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

//从数据库中获取所有商品的点击次数作为特征向量
function fetchItemVectors(callback) {
    const query = 'SELECT itemID, SUM(ClickCount) AS totalClicks FROM UserItemInteractions GROUP BY itemID';
    pool.query(query, function(error, results) {
        if (error) {
            return callback(error, null);
        }
        const itemVectors = {};
        results.forEach(item => {
            itemVectors[item.itemID] = [item.totalClicks];
        });
        callback(null, itemVectors);
    });
}
// 根据用户的历史互动推荐商品
function fetchRecommendedItems(username, page, pageSize, callback) {
    console.log(username);
    console.log(page);
    console.log(pageSize);
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, userResults) {
        if (error || userResults.length === 0) {
            console.log(error);
            return callback(new Error('找不到该用户'));
        }

        const userID = userResults[0].userID;

        pool.query('SELECT itemID FROM UserItemInteractions WHERE userID = ? GROUP BY itemID ORDER BY COUNT(*) DESC LIMIT 1', [userID], function(error, results) {
            if (error) {
                return callback(error);
            }

            if (results.length === 0) {
                // 对于新用户，修改查询以联合User表获取userName
                const queryForNewUser = 'SELECT Items.*, User.userName FROM Items JOIN User ON Items.userID = user.userID ORDER BY Items.ItemID DESC LIMIT ? OFFSET ?';
                const offset = (page - 1) * pageSize;
                pool.query(queryForNewUser, [parseInt(pageSize), offset], function(err, items) {
                    if (err) {
                        console.log(err);
                        return callback(err);
                    }
                    return callback(null, items);
                });
            } else {
                // 对于老用户，执行之前定义的推荐逻辑
                const favoriteItemID = results[0].itemID;
                fetchItemVectors(function(err, itemVectors) {
                    if (err) {
                        console.log(err);
                        return callback(err);
                    }

                    const favoriteVector = itemVectors[favoriteItemID];
                    const similarities = Object.keys(itemVectors).map(itemID => ({
                        itemID: itemID,
                        similarity: cosineSimilarity(favoriteVector, itemVectors[itemID])
                    })).sort((a, b) => b.similarity - a.similarity);

                    const startIndex = (page - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const pagedItems = similarities.slice(startIndex, endIndex);

                    const itemIDs = pagedItems.map(item => parseInt(item.itemID));
                    if (itemIDs.length === 0) {
                        return callback(null, []);
                    }

                    const placeholders = itemIDs.map(() => '?').join(',');
                    const itemDetailsQuery = `SELECT Items.*, User.userName FROM Items JOIN User ON Items.userID = user.userID WHERE Items.ItemID IN (${placeholders})`;
                    pool.query(itemDetailsQuery, itemIDs, function(error, detailedItems) {
                        if (error) {
                            console.log(error);
                            return callback(new Error('查询商品详细信息失败'));
                        }
                        callback(null, detailedItems);
                    });
                });
            }
        });
    });
}


router.post('/', function(req, res) {
    const { username, page, pageSize } = req.body;

    if (!username || page == null || pageSize == null) {
        return res.status(400).json({ success: false, message: '缺少必要的参数' });
    }

    fetchRecommendedItems(username, parseInt(page), parseInt(pageSize), function(err, recommendedItems) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
            success: true,
            message: '获取推荐商品成功',
            data: recommendedItems
        });
    });
});


module.exports = router;



const express = require('express');
const router = express.Router();
const pool = require('../dbPool');

// 获取用户最感兴趣的三个商品
function getTopThreeItems(userID, callback) {
    const sql = `
        SELECT itemID, SUM(ClickCount) AS TotalClicks
        FROM UserItemInteractions
        WHERE userID = ?
        GROUP BY itemID
        ORDER BY TotalClicks DESC
        LIMIT 3;
    `;
    pool.query(sql, [userID], function (err, results) {
        if (err) {
            console.error("查询最感兴趣的三个商品时出错:", err);
            return callback(err);
        }
        console.log("获取到的最感兴趣的三个商品:", results);
        callback(null, results.length === 0 ? null : results);
    });
}

//计算推荐指数并排序
function computeRecommendations(topThreeItems, userID, callback) {
    console.log("开始计算推荐...");
    //计算一个商品的推荐指数函数（此处是定义，不会立刻执行）
    const computeItemRecScore = (itemId, topItems) => {
        console.log(`开始计算商品 ${itemId} 的推荐分数。`);
        return new Promise((resolve, reject) => {
            let recommendationScore = 0;
            const similarityPromises = topItems.map(topItem => {
                return new Promise((innerResolve, innerReject) => {
                    pool.query('SELECT similarity FROM ItemSimilarity WHERE (item_id1 = ? AND item_id2 = ?) OR (item_id1 = ? AND item_id2 = ?)',
                        [itemId, topItem.itemID, topItem.itemID, itemId], (err, similarities) => {
                            if (err) {
                                console.error(`查询商品 ${itemId} 与 ${topItem.itemID} 的相似度时出错:`, err);
                                return innerReject(err);
                            }
                            if (similarities.length > 0) {
                                const similarityScore = similarities[0].similarity;
                                recommendationScore += similarityScore * topItem.TotalClicks;
                                console.log(`商品 ${itemId} 与商品 ${topItem.itemID} 的相似度为 ${similarityScore}, 计算后的推荐分数: ${recommendationScore}`);
                            }
                            innerResolve();
                        });
                });
            });
            Promise.all(similarityPromises)
                .then(() => {
                    console.log(`商品 ${itemId} 的最终推荐分数为 ${recommendationScore}`);
                    resolve({ itemID: itemId, value: recommendationScore });
                })
                .catch(error => {
                    console.error(`处理商品 ${itemId} 推荐分数时出错:`, error);
                    reject(error);
                });
        });
    };
    //computeRecommendations函数从此处执行
    if (!topThreeItems) {
        //新用户没有点击记录推荐Items表中倒序排列的商品
        pool.query('SELECT itemID FROM Items ORDER BY itemID DESC', function (err, items) {
            if (err) {
                console.error("查询商品列表时出错:", err);
                return callback(err);
            }
            console.log(`为新用户推荐的商品，总计 ${items.length} 项。`);
            callback(null, items.map(item => item.itemID));
        });
    } else {
        //获取用户最喜欢的三个商品的ID
        const topThreeItemIDs = topThreeItems.map(item => item.itemID);
        pool.query('SELECT itemID FROM Items WHERE itemID NOT IN (?)', [topThreeItemIDs], function (err, items) {
            if (err) {
                console.error("查询商品列表时出错:", err);
                return callback(err);
            }
            console.log(`查询到的商品（排除了最感兴趣的三个），总计 ${items.length} 项。开始计算每个商品的推荐分数。`);

            const itemPromises = items.map(item => computeItemRecScore(item.itemID, topThreeItems));
            Promise.all(itemPromises)
                .then(recommendations => {
                    console.log("推荐数据（包含推荐指数）:", recommendations);
                    recommendations.sort((a, b) => b.value - a.value);
                    const filteredRecommendations = recommendations.filter(rec => rec.userID !== userID).map(rec => rec.itemID);
                    const finalRecommendations = topThreeItemIDs.concat(filteredRecommendations);
                    console.log("包含最喜欢的三个商品的排序后的最终推荐商品ID列表:", finalRecommendations);
                    callback(null, finalRecommendations);
                })
                .catch(error => {
                    console.error("计算推荐指数时出错:", error);
                    callback(error);
                });
        });
    }
}

router.post('/', function (req, res) {
    const { username, page = 1, pageSize = 10 } = req.body;
    console.log(`接收到的请求数据：用户名-${username}, 页码-${page}, 每页大小-${pageSize}`);

    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function (err, users) {
        if (err || users.length === 0) {
            console.error("查找用户出错:", err);
            return res.status(500).json({ success: false, message: "无法找到用户或数据库错误" });
        }
        const userID = users[0].userID;
        getTopThreeItems(userID, function (err, topItems) {
            if (err) {
                return res.status(500).json({ success: false, message: "获取顶部商品失败" });
            }
            computeRecommendations(topItems, userID, function (err, recommendedItemIDs) {
                if (err) {
                    return res.status(500).json({ success: false, message: "计算推荐失败" });
                }
                // 排序
                const fieldOrder = 'FIELD(Items.itemID, ' + recommendedItemIDs.join(',') + ')';
                // 获取所有推荐商品的详细信息，按推荐顺序排序，过滤掉用户自己发布的商品
                pool.query(`
                    SELECT Items.*, user.userName FROM Items
                    JOIN user ON Items.userID = user.userID
                    WHERE Items.itemID IN (?) AND Items.userID != ?
                    ORDER BY ${fieldOrder}
                `, [recommendedItemIDs, userID], function (err, items) {
                    if (err) {
                        console.error("获取商品详细信息时出错:", err);
                        return res.status(500).json({ success: false, message: "获取商品详情失败" });
                    }
                    // 分页逻辑
                    const startIndex = (page - 1) * pageSize;
                    const paginatedData = items.slice(startIndex, startIndex + pageSize).map(item => ({
                        ItemID: item.ItemID,
                        ItemName: item.ItemName,
                        userName: item.userName,
                        Category: item.Category,
                        Price: item.Price,
                        Image: item.Image ? `data:image/jpeg;base64,${Buffer.from(item.Image).toString('base64')}` : null
                    }));
                    res.json({
                        success: true,
                        data: paginatedData
                    });
                });
            });
        });
    });
});

module.exports = router;

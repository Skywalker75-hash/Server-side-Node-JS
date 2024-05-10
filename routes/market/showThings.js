const express = require('express');
const router = express.Router();
const pool = require('../dbPool');

//计算两个向量之间的余弦相似度
function cosineSimilarity(vec1, vec2) {
    let x = 0, normA = 0, normB = 0;
    for (let i = 0; i < vec1.length; i++) {
        x += vec1[i] * vec2[i];//累加向量的对应元素的乘积，计算点积
        normA += Math.pow(vec1[i], 2);
        normB += Math.pow(vec2[i], 2);
    }
    return x / (Math.sqrt(normA) * Math.sqrt(normB));
}
// 获取商品的向量
function fetchItemVectors(callback) {
    // 先查询系统中有多少不同的用户
    pool.query('SELECT DISTINCT userID FROM UserItemInteractions ORDER BY userID', function(error, users) {
        if (error) {
            return callback(error, null);
        }

        // 初始化用户索引映射
        const userIndexMap = {};
        users.forEach((user, index) => {
            userIndexMap[user.userID] = index;
        });

        // 准备查询所有商品的点击次数
        var query = `SELECT Items.itemID, UserItemInteractions.userID, IFNULL(UserItemInteractions.ClickCount, 0) AS Clicks
                     FROM Items
                     LEFT JOIN UserItemInteractions ON Items.itemID = UserItemInteractions.itemID
                     ORDER BY Items.itemID, UserItemInteractions.userID`;

        pool.query(query, function(error, results) {
            if (error) {
                return callback(error, null);
            }
            var itemVectors = {};

            // 初始化向量，并用0填充
            results.forEach(result => {
                if (!itemVectors[result.itemID]) {
                    itemVectors[result.itemID] = new Array(users.length).fill(0);
                }
                const index = userIndexMap[result.userID];
                itemVectors[result.itemID][index] = result.Clicks;
            });

            console.log("Item Vectors: ", itemVectors);
            callback(null, itemVectors);
        });
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

        // 尝试找出最后一条购买记录
        pool.query('SELECT itemID FROM buyItems WHERE userID = ? ORDER BY buyID DESC LIMIT 1', [userID], function(error, buyResults) {
            if (error) {
                return callback(error);
            }
            if (buyResults.length > 0) {
                // 如果用户有购买记录
                recommendBasedOnItem(buyResults[0].itemID);
            } else {
                // 如果用户没有购买记录，使用点击最多的商品推荐
                pool.query('SELECT itemID FROM UserItemInteractions WHERE userID = ? GROUP BY itemID ORDER BY COUNT(*) DESC LIMIT 1', [userID], function(error, interactionResults) {
                    if (error || interactionResults.length === 0) {
                        return fetchAllItems(userID,page, pageSize, callback); // 如果没有交互记录，推荐新用户逻辑
                    }
                    recommendBasedOnItem(interactionResults[0].itemID);
                });
            }
        });
        //基于最喜欢的商品推荐与其相似的商品
        function recommendBasedOnItem(favoriteItemID) {
            fetchItemVectors(function(err, itemVectors) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                const favoriteVector = itemVectors[favoriteItemID];
                var similarities = [];
                var itemIDs = Object.keys(itemVectors);

                itemIDs.forEach(itemID => {
                    var currentItemVector = itemVectors[itemID];
                    var similarity = cosineSimilarity(favoriteVector, currentItemVector);
                    similarities.push({
                        itemID: itemID,
                        similarity: similarity
                    });
                });

                console.log("排序前的相似度: ", similarities);  // 输出未排序的相似度结果
                similarities.sort((a, b) => b.similarity - a.similarity);
                console.log("排序完的相似度", similarities);  // 输出排序后的相似度结果

                const sortedItemIDs = similarities.map(item => item.itemID); // 提取排序后的itemIDs
                console.log("Sorted Item IDs for query: ", sortedItemIDs);  // 输出用于数据库查询的排序后的商品ID列表

                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pagedSimilarItems = sortedItemIDs.slice(startIndex, endIndex);
                console.log("Paged Similar Items: ", pagedSimilarItems);  // 输出分页后的商品ID列表

                if (pagedSimilarItems.length === 0) {
                    return callback(null, []);
                }

                const placeholders = pagedSimilarItems.map(() => '?').join(',');
                const orderClause = `FIELD(ItemID, ${pagedSimilarItems.join(',')})`;  // 构造ORDER BY子句
                const itemDetailsQuery = `SELECT Items.*, User.userName FROM Items JOIN User ON Items.userID = User.userID WHERE Items.ItemID IN (${placeholders}) AND Items.isSold = 0 AND Items.userID != ? ORDER BY ${orderClause}`;

                pool.query(itemDetailsQuery, [...pagedSimilarItems, userID], function(error, detailedItems) {
                    if (error) {
                        console.log(error);
                        return callback(new Error('查询商品详细信息失败'));
                    }
                    callback(null, detailedItems.map(processItem));
                });
            });
        }

    });
}
// 新用户推荐逻辑：排除用户自己发布的商品
function fetchAllItems(userID, page, pageSize, callback) {
    const query = 'SELECT Items.*, User.userName FROM Items JOIN User ON Items.userID = User.userID AND Items.isSold = 0 AND Items.userID != ? ORDER BY Items.itemID DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * pageSize;
    pool.query(query, [userID, parseInt(pageSize), offset], function(err, items) {
        if (err) {
            console.log(err);
            return callback(err);
        }

        // 处理每个商品项，将图片的二进制数据转换为Base64字符串
        const processedItems = items.map(item => {
            if (item.Image) {
                // 假设图片存储为Buffer对象（二进制数据）
                // 转换为Base64字符串
                item.Image = Buffer.from(item.Image).toString('base64');
                item.Image = `data:image/jpeg;base64,${item.Image}`; // 您可能需要根据实际图片格式调整MIME类型
            }
            return item;
        });

        return callback(null, processedItems);
    });
}

// 处理每个商品项，将图片的二进制数据转换为Base64字符串
function processItem(item) {
    if (item.Image) {
        // 假设图片存储为Buffer对象（二进制数据）
        // 转换为Base64字符串
        item.Image = Buffer.from(item.Image).toString('base64');
        item.Image = `data:image/jpeg;base64,${item.Image}`; // 根据实际图片格式调整MIME类型
    }
    return item;
}

//主函数
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



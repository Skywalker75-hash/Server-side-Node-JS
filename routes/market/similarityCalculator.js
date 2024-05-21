const schedule = require('node-schedule');
const pool = require('../dbPool');  // 假设这是你的数据库连接池模块
//计算余弦相似度
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        normA += vec1[i] * vec1[i];
        normB += vec2[i] * vec2[i];
    }
    //防止除以零的情况发生
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

//获取商品的向量
function fetchItemVectors(callback) {
    //查询系统中有多少不同的用户
    pool.query('SELECT DISTINCT userID FROM UserItemInteractions ORDER BY userID', function(error, users) {
        if (error) {
            return callback(error, null);
        }
        //初始化用户索引映射
        const userIndexMap = {};
        users.forEach((user, index) => {
            userIndexMap[user.userID] = index;
        });
        //查询所有商品的点击次数
        var query = `SELECT Items.itemID, UserItemInteractions.userID, IFNULL(UserItemInteractions.ClickCount, 0) AS Clicks
                     FROM Items
                     LEFT JOIN UserItemInteractions ON Items.itemID = UserItemInteractions.itemID
                     ORDER BY Items.itemID, UserItemInteractions.userID`;

        pool.query(query, function(error, results) {
            if (error) {
                return callback(error, null);
            }
            var itemVectors = {};
            //初始化向量，并用0填充
            results.forEach(result => {
                if (!itemVectors[result.itemID]) {
                    itemVectors[result.itemID] = new Array(users.length).fill(0);
                }
                const index = userIndexMap[result.userID];
                itemVectors[result.itemID][index] = result.Clicks;
            });
            console.log("物品向量 ", itemVectors);
            callback(null, itemVectors);
        });
    });
}
//计算所有相似度并存入数据库
function computeStoreItemSimilarities() {
    fetchItemVectors((error, itemVectors) => {
        if (error) {
            console.error('未能成功获取余弦相似度：', error);
            return;
        }
        let itemIDs = Object.keys(itemVectors);
        itemIDs.forEach((id1, index1) => {
            for (let index2 = index1 + 1; index2 < itemIDs.length; index2++) {
                const id2 = itemIDs[index2];
                const similarity = cosineSimilarity(itemVectors[id1], itemVectors[id2]);
                const sql = 'REPLACE INTO ItemSimilarity (item_id1, item_id2, similarity) VALUES (?, ?, ?)';
                pool.query(sql, [id1, id2, similarity], (err, result) => {
                    if (err) {
                        console.error('未能成功上传到数据库：', err);
                    }
                });
            }
        });
        console.log('相似度计算完成');
    });
}


function scheduleSimilarityCalculation() {
    //服务器开机执行一次相似度计算
    computeStoreItemSimilarities();
    //每天凌晨1点执行一次相似度计算
    schedule.scheduleJob('0 1 * * *', computeStoreItemSimilarities);
    console.log("每日1点更新物品相似度");
}

module.exports = { scheduleSimilarityCalculation };

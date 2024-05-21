var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 购买商品
router.post('/', function(req, res) {
    const { username, itemID } = req.body;
    console.log(username);
    console.log(itemID);
    if (!username || !itemID) {
        return res.status(400).json({ success: false, message: '缺少必要的参数' });
    }

    // 查询商品价格、卖家信息和买家userID
    const queryItem = 'SELECT Price, userID FROM Items WHERE ItemID = ?';
    pool.query(queryItem, [itemID], function(error, itemResults) {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: '查询商品信息失败' });
        }

        if (itemResults.length === 0) {
            return res.status(404).json({ success: false, message: '未找到该商品' });
        }

        const { Price, userID: sellerID } = itemResults[0];

        // 查询买家信息，包括挂失状态
        const queryBuyer = 'SELECT user.userID, CampusCards.balance, CampusCards.accountID, CampusCards.lostStatus FROM user INNER JOIN CampusCards ON user.userID = CampusCards.userID WHERE user.username = ?';
        pool.query(queryBuyer, [username], function(error, buyerResults) {
            if (error || buyerResults.length === 0) {
                console.error(error);
                return res.status(500).json({ success: false, message: '查询买家信息失败' });
            }

            const { userID: buyerID, balance, accountID: buyerAccountID, lostStatus } = buyerResults[0];

            // 检查校园卡是否挂失
            if (lostStatus === 1) {
                return res.status(403).json({ success: false, message: '校园卡处于挂失状态，无法进行交易' });
            }

            // 确保买家不是卖家
            if (buyerID === sellerID) {
                return res.status(400).json({ success: false, message: '您不能购买自己的商品' });
            }

            // 检查余额是否足够
            if (balance < Price) {
                return res.status(400).json({ success: false, message: '余额不足' });
            }

            // 更新买家余额
            const updateBuyerBalance = 'UPDATE CampusCards SET balance = balance - ? WHERE accountID = ?';
            pool.query(updateBuyerBalance, [Price, buyerAccountID], function(error) {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, message: '更新买家余额失败' });
                }

                // 更新卖家余额
                const updateSellerBalance = 'UPDATE CampusCards SET balance = balance + ? WHERE userID = ?';
                pool.query(updateSellerBalance, [Price, sellerID], function(error) {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ success: false, message: '更新卖家余额失败' });
                    }

                    // 删除 itemsimilarity 表中与该商品相关的记录
                    const deleteItemSimilarity = 'DELETE FROM ItemSimilarity WHERE item_id1 = ? OR item_id2 = ?';
                    pool.query(deleteItemSimilarity, [itemID, itemID], function(error) {
                        if (error) {
                            console.error(error);
                            return res.status(500).json({ success: false, message: '删除商品相似度记录失败' });
                        }

                        // 删除商品记录
                        const deleteItem = 'DELETE FROM Items WHERE ItemID = ?';
                        pool.query(deleteItem, [itemID], function(error) {
                            if (error) {
                                console.error(error);
                                return res.status(500).json({ success: false, message: '删除商品记录失败' });
                            }

                            // 继续执行后续的购买成功逻辑
                            res.json({ success: true, message: '购买成功，商品已删除，余额已更新' });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;

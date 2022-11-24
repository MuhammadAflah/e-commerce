var db = require('../config/connection')
var bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
var collection = require('../config/collection')
const { resolve, reject } = require('promise')
var objectId = require('mongodb').ObjectId

module.exports = {

    // add to wishlist
    addToWishlist: (userId, proId) => {
        let proObj = {
            item: ObjectId(proId),
        }
        return new Promise(async (resolve, reject) => {
            console.log(userId, proId);
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log(userWishlist);
            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) }, {
                        $pull: { products: { item: ObjectId(proId) } }
                    }).then(() => {
                        console.log('pulled successfulllyy');
                        reject()
                    })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) }, {
                        $push: {
                            products: proObj
                        }
                    }).then(() => {
                        console.log('pushed successfullllyyyylyl');
                        resolve()
                    })
                }

            } else {
                wishobj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishobj).then(() => {
                    console.log('created and pushhhheed');
                    resolve()
                })
            }

        })

    },

    // get wishlist product
    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistItem = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(wishlistItem)
        })
    },

    // delete wish item
    deleteWishItem: (proId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) }, {
                $pull: {
                    products: {
                        item: ObjectId(proId)
                    }
                }
            }).then(() => {
                console.log('pulled successsfully');
                resolve()
            })
        })
    }
}
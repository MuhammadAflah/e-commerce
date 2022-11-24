let db = require('../config/connection')
const { resolve, reject } = require('promise')
var collection = require('../config/collection')
const { ObjectId } = require('mongodb')
let objectId = require('mongodb').ObjectId

module.exports = {

    // add product
    addProduct: (data) => {
        data.price = parseInt(data.price)
        data.stock = parseInt(data.stock)
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ name: data.name })
            if (product) {
                reject()
            } else {
                db.get().collection(collection.PRODUCT_COLLECTION).insertOne(data).then((response) => {
                    console.log(response);
                    resolve(response)
                })
            }

        })
    },

    // get all products
    getAllProducts: () => {
        return new Promise((resolve, reject) => {
            let allProducts = db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(allProducts)
        })
    },

    // delete product
    deleteProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            let delProduct = await db.get().collection(collection.CART_COLLECTION).findOne({ products: { $elemMatch: { item: objectId(id) } } })
            if (delProduct) {
                reject()
            } else {
                db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                    resolve()
                })
            }

        })
    },

    // get product details
    getProductDetails: (id) => {
        console.log(id);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((response) => {
                console.log('product');
                console.log(response);
                resolve(response)
            })

        })
    },

    // edit product
    editProduct: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(data._id) }, {
                $set: {
                    name: data.name,
                    category: data.category,
                    price: parseInt(data.price),
                    description: data.description,
                    stock: parseInt(data.stock)
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    // editProduct: (id, newData) => {
    //     newData.stock = parseInt(newData.stock)
    //     return new Promise(async(resolve, reject) => {
    //         let prod = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) })
    //         if (prod.stockout || newData.stock > 0) {
    //         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(id) }, {
    //             $set: {
    //                 name:newData.name,
    //                 category: newData.category,
    //                 price: parseInt(newData.price),
    //                 description: newData.description,
    //                 stock: parseInt(newData.stock)
    //             },
    //             $unset:{
    //                 stockout: ""
    //             }
    //         }).then((response) => {
    //             resolve()
    //         })
    //         }else if(newData.stock === 0){
    //             db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},{
    //                 $set:{
    //                     name:newData.name,
    //                     category: newData.category,
    //                     price: parseInt(newData.price),
    //                     description: newData.description,
    //                     stock: parseInt(newData.stock),
    //                     stockout: true
    //                 }
    //             }).then((response)=>{
    //                 resolve()
    //             })
    //         }else {
    //             db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(data._id) },
    //                 {
    //                     $set: {
    //                         name:data.name,
    //                     category: data.category,
    //                     price: parseInt(data.price),
    //                     description: data.description,
    //                     stock: parseInt(data.stock),
    //                     stockout: true
    //                     }
    //                 }).then((response) => {
    //                     resolve(response)
    //                 })
    //         }
    //     })
    // },

    // all category
    allCategory: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((response) => {
                resolve(response)
            })
        })
    },

    // sort product
    sortProductasc: () => {
        return new Promise(async (resolve, reject) => {
            let sortasc = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({ price: 1 }).toArray()
            resolve(sortasc)
        })
    },
    sortProductdesc: () => {
        return new Promise(async (resolve, reject) => {
            let sortdesc = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({ price: -1 }).toArray()
            resolve(sortdesc)
        })
    },
    getCatWiseProduct: (category) => {
        return new Promise(async (resolve, reject) => {
            let catWisePro = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
            resolve(catWisePro)
        })
    },

    // find stock
    findStock: (id) => {
        return new Promise(async (resolve, reject) => {
            let stock = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: objectId(id) });
            resolve(stock);
        });
    },

}

var db = require('../config/connection')
const bcrypt = require('bcrypt')
var collection = require('../config/collection')
const { resolve, reject } = require('promise')
var objectId = require('mongodb').ObjectId
const moment = require('moment');
const referralCodeGenerator = require('referral-code-generator')
const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk');

var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.client_id,
    'client_secret': process.env.client_secret
});
module.exports = {

    //user signup
    signup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let user1 = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
            if (user || user1) {
                resolve(response.status = false)
            }
            let referral = userData.referral;
            if (referral) {
                let referUser = await db
                    .get()
                    .collection(collection.USER_COLLECTION)
                    .findOne({ referralCode: referral });
                if (referUser) {
                    userData.password = await bcrypt.hash(userData.password, 10);
                    let referralCode =
                        userData.name.slice(0, 3) +
                        referralCodeGenerator.alpha("lowercase", 6);
                    userData.referralCode = referralCode;
                    userData.wallet = parseInt(50)
                    db.get()
                        .collection(collection.USER_COLLECTION)
                        .insertOne(userData)
                        .then((userdata) => {
                            if (referUser.wallet) {
                                walletAmount = parseInt(referUser.wallet);
                                db.get()
                                    .collection(collection.USER_COLLECTION)
                                    .updateOne(
                                        { _id: objectId(referUser._id) },
                                        {
                                            $set: {
                                                wallet: parseInt(100) + walletAmount,
                                            },
                                        }
                                    )
                                    .then(() => {
                                        resolve({ status: true });
                                    });
                            } else {
                                db.get()
                                    .collection(collection.USER_COLLECTION)
                                    .updateOne(
                                        { _id: objectId(referUser._id) },
                                        {
                                            $set: {
                                                wallet: parseInt(100),
                                            },
                                        }
                                    )
                                    .then(() => {
                                        resolve({ status: true });
                                    });
                            }
                        });
                } else {
                    reject();
                }
            } else {
                userData.password = await bcrypt.hash(userData.password, 10);
                let referralCode =
                    userData.name.slice(0, 3) +
                    referralCodeGenerator.alpha("lowercase", 6);
                userData.referralCode = referralCode;
                db.get()
                    .collection(collection.USER_COLLECTION)
                    .insertOne(userData)
                    .then((response) => {

                        resolve({ status: true });
                    });
            }
        })
    },

    // login
    login: (userData) => {
        // var p = userData.password
        return new Promise(async (resolve, reject) => {
            // let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                if (user.isBlocked) {
                    response.isBlocked = true;
                    console.log('blocked');
                    resolve(response)
                } else {
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            console.log('login success');
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log('login failed!!!!');
                            resolve({ status: false })
                        }
                    })
                }
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },

    // verify mobile number
    verifyMobile: (phone) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: phone })
            resolve(user)
        })
    },

    // add to cart
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {

                            $push: { products: proObj }

                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    // cart products
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        subtotal: '$products.subtotal'
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
                        item: 1, quantity: 1, subtotal : 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(cartItems)
        })
    },

    // cart count
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    // wishlist count
    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wishlist) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    },

    // change product quantity
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise(async (resolve, reject) => {
            let stockCount = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(details.product) })
            if (details.quantity == stockCount.stock && details.count == 1) {
                reject()
            } else {
                if (details.count == -1 && details.quantity == 1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {

                        resolve({ removeProduct: true })
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
                }
            }
        })
    },

    //delete cart item
    deleteCartItem: (cartId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId), 'products.item': objectId(proId) }, {
                $pull: { products: { item: objectId(proId) } }
            }).then((response) => {
                resolve()
            })
        })
    },

    //product Count 
    findProCount: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: {
                            user: objectId(userId)
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            products: '$products'
                        }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: {
                            'products.item': objectId(proId)
                        }
                    },
                    {

                        $project: {
                            quantity: '$products.quantity'
                        }
                    }
                ]).toArray()
                resolve(count[0].quantity)
            } catch {
                resolve(0)
            }
        })
    },

    // get total amount
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
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
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                        }
                    }

                ]).toArray()
                resolve(total[0].total)
            } catch (err) {
                resolve(0)
            }
        })
    },

    // get user details
    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((response) => {
                resolve(response)
            })
        })
    },

    // place order
    placeOrder: (order, products, total) => {
        console.log('place order function called');
        return new Promise((resolve, reject) => {
            if (order.coupon) {
                db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: order.coupon }, {
                    $push: {
                        users: order.userId
                    }
                })
            }
            let status = order.paymentMethod === 'COD' || order.paymentMethod === 'wallet' || order.paymentMethod === 'paypal' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    address: order.address,
                    state: order.state,
                    district: order.district,
                    town: order.town,
                    pincode: order.pincode,
                    phone: order.phone
                },
                userId: objectId(order.userId),
                paymentMethod: order.paymentMethod,
                products: products,
                totalAmount: total,
                status: status,
                coupon: order.coupon,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                products.forEach(async (element) => {
                    let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: element.item });
                    let pquantity = Number(product.stock);
                    pquantity = pquantity - element.quantity;
                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                        { _id: element.item },
                        {
                            $set: {
                                stock: pquantity,
                            },
                        }
                    );
                });

                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) });
                resolve(response.insertedId);
            });
        });
    },

    // cart product list
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                resolve(cart.products)
            } else {
                resolve(0)
            }

        })
    },

    //orders
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }, { sort: { date: -1 } }).toArray()
            var i;
            for (i = 0; i < orders.length; i++) {
                orders[i].date = moment(orders[i].date).format('lll');
            }
            resolve(orders)
        })
    },

    // ordered products
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
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
            resolve(orderItems)
        })
    },

    // cancel order
    cancelOrder: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: "cancelled",
                        isCancelled: true,
                        cancellDate: new Date()
                    }
                }).then((response) => {
                    resolve(response)
                })

        })
    },

    // return order
    returnOrder: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                {
                    $set: {
                        status: "returned",
                        isReturned: true,
                        returnedDate: new Date()
                    }
                }).then((response) => {
                    resolve(response)
                })

        })
    },

    // get address
    getAddress: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }, {
                $projection: {
                    address: 1
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    // user details
    userDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            resolve(data)
        })
    },

    // add address
    addAddress: (address, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $addToSet: {
                    address: address
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    //edit address
    editAddress: (data, userId) => {
        let uniqueid = data.id
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            let index = user.address.findIndex(address => address.uniqueid == uniqueid)
            db.get().collection(collection.USER_COLLECTION).updateOne({_id: objectId(userId), 'address.id': uniqueid }, {
                $set: {
                    'address.$': data
                }
            }).then(() => {
                resolve()
            })

        })
    },


    // delete address
    deleteAddress: (userId, addressId) => {
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId), 'address.id': addressId }, {
            $pull: { address: { id: addressId } }
        })
        resolve(true)
    },

    // edit profile
    editProfile: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(data._id) }, {
                $set: {
                    name: data.name,
                    email: data.email,
                    mobile: data.mobile
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    // password change
    changePassword: (userId, data) => {
        return new Promise(async (resolve, reject) => {
            let password = data.password
            let newpassword = data.newpassword
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            bcrypt.compare(password, user.password).then(async (status) => {
                if (status) {
                    newpassword = await bcrypt.hash(newpassword, 10)
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                        $set: {
                            password: newpassword
                        }
                    }).then((response) => {
                        resolve()
                    })
                } else {
                    reject()
                }

            })
        })
    },

    //generate razorpay
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  //amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    resolve(order)
                }
            });
        })
    },

    //verify payment
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', process.env.key_secret)
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },

    // change product status
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    // generate paypal
    generatePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/order-placed",
                    "cancel_url": "http://localhost:3000/place-order"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "This is the payment description."
                }]
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    resolve(payment.links[1].href)
                }
            });
        })
    },

    //wallet purchase
    reduceWallet: (id, total) => {
        return new Promise(async (resolve, reject) => {
            let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ _id: objectId(id) });
            let amount = user.wallet - total;
            await db
                .get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: objectId(id) },
                    {
                        $set: {
                            wallet: parseInt(amount),
                        },
                    }
                )
                .then(() => {
                    resolve();
                });
        });
    },

    //get wallet amount
    getWalletAmount: (id) => {
        return new Promise(async (resolve, reject) => {
            let wallet = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            resolve(wallet.wallet)
        })
    },

    // check blocked or unblock
    isBlockedUser: (emailId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({ email: emailId }).then((response) => {
                resolve(response)
            })
        })
    },


    // status track
    statusTrack: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let track = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
            resolve(track)
        })
    },

    // get order
    getOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) }).then((response) => {
                resolve(response)
            })
        })
    },

    // wallet
    findWallet: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((response) => {
                resolve(response)
            })
        })
    },


    //
    // invoice
    getUserInvoice: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: objectId(orderId) }, { sort: { date: -1 } }).toArray()
            var i;
            for (i = 0; i < orders.length; i++) {
                orders[i].date = moment(orders[i].date).format('lll');
            }
            var k;
            for (k = 0; k < orders.length; k++) {
                orders[k].deliverdDate = moment(orders[k].deliverdDate).format('lll');
            }
            resolve(orders)
        })
    },

    // set wallet
    setWallet: (amount, orderId, id) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: objectId(id) },
                    {
                        $set: {
                            wallet: parseInt(amount),
                        },
                    }
                )
                .then(() => {
                    db.get()
                        .collection(collection.ORDER_COLLECTION)
                        .updateOne(
                            { _id: objectId(orderId) },
                            {
                                $set: {
                                    status: "Refund has been initiated",
                                    isReturned: true
                                },

                            }
                        )
                        .then(() => {
                            resolve()
                        });
                });
        })
    },

    // get order details
    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: objectId(orderId) }).toArray();
            var i;
            for (i = 0; i < orderDetails.length; i++) {
                orderDetails[i].date = moment(orderDetails[i].date).format("LLLL");
            }
            resolve(orderDetails[0]);
        });
    },

    // cart sub total
    getCartSubTotal: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            let cartSubTotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
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
                    $match: {
                        item: objectId(proId)
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        unitprice: { $toInt: '$product.price' },
                        quantity: { $toInt: '$quantity' }
                    }
                },
                {
                    $project: {
                        _id: null,
                        subtotal: { $sum: { $multiply: ['$quantity', '$unitprice'] } }
                    }
                }
            ]).toArray()
            if (cartSubTotal.length > 0) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), "products.item": objectId(proId) },
                    {
                        $set: {
                            'products.$.subtotal': cartSubTotal[0].subtotal
                        }
                    }).then((response) => {
                        resolve(cartSubTotal[0].subtotal)
                    })
            }
            else {
                cartSubTotal = 0
                resolve(cartSubTotal)
            }
        })
    },
}



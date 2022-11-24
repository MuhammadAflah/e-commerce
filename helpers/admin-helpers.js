var db = require('../config/connection')
var bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
var collection = require('../config/collection')
const { resolve, reject } = require('promise')
const moment = require('moment')
var objectId = require('mongodb').ObjectId

module.exports = {
    // get all users
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let allUsers = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(allUsers)
        })
    },

    // admin login
    adminLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: data.email })
            if (admin) {
                bcrypt.compare(data.password, admin.password).then((status) => {
                    if (status) {
                        console.log('success');
                        response.admin = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('denied');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('no user exists');
                resolve({ status: false })
            }
        })
    },

    // block user
    blockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    isBlocked: true
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    //unblock user
    unblockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    isBlocked: false
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    // delete user
    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },

    addAdmin: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let admindata = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: data.email })
            if (admindata) {
                console.log("admin already exists");
                resolve(response.status = false)
            } else {
                data.password = await bcrypt.hash(data.password, 10)
                db.get().collection(collection.ADMIN_COLLECTION).insertOne(data).then((req, res) => {
                    resolve(resolve.status = true)
                })
            }
        })
    },

    // get all categories
    getAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            let allCategories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(allCategories)
        })
    },

    // get single category
    getCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).find({ _id: objectId(id) }).toArray().then((response) => {
                resolve(response)
            })
        })
    },

    // edit category
    editCategory: (data) => {
        function capitalize(string) {
            return string.toUpperCase();
        }
        let Category = data.category
        let id = data.id;
        let response = {};
        return new Promise(async (resolve, reject) => {
            let categoryExist = await db
                .get()
                .collection(collection.CATEGORY_COLLECTION)
                .findOne({ category: Category });
            if (categoryExist) {
                resolve({ status: false });
            } else {
                db.get()
                    .collection(collection.CATEGORY_COLLECTION)
                    .updateOne(
                        { _id: objectId(id) },
                        {
                            $set: {
                                category: Category,
                            },
                        }
                    )
                    .then(() => {
                        response.status = true;
                        resolve(response);
                    });
            }
        });
    },

    // add category
    addCategory: (data) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: data.category })
            if (category) {
                resolve({ status: false })
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },

    //delete category
    deleteCategory: (id, category) => {
        return new Promise(async (resolve, reject) => {
            let prodExist = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ category: category })
            if (prodExist != null) {
                reject()
            } else {
                await db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                    resolve(response)
                })
            }

        })
    },

    // get product details
    getProductDetails: (id) => {
        return new Promise((resolve, reject) => {
            let productDetails = db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },

    // get all users
    getAllUsersName: (id) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ date: -1 }).toArray()
            var i;
            for (i = 0; i < orders.length; i++) {
                orders[i].date = moment(orders[i].date).format('lll');
            }
            resolve(orders)
        });
    },

    // order status change
    orderStatusChange: (status, orderId) => {
        return new Promise((resolve, reject) => {
            if (status == "cancelled") {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        isCancelled: true,
                        cancellDate: new Date()
                    }
                }).then(() => {
                    resolve()
                })
            } else if (status == "delivered") {

                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        isDelivered: true,
                        deliverdDate: new Date()

                    }

                }).then(() => {
                    resolve()
                })
            } else if (status == "shipped") {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        isShipped: true,
                        shippedDate: new Date()

                    }

                }).then(() => {
                    resolve()
                })
            } else if (status == "Out For Delivery") {

                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        isOutForDelivery: true,
                        OutForDeliveryDate: new Date()
                    }

                }).then(() => {
                    resolve()
                })
            } else if (status == "returned") {

                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        isReturned: true,
                        returnedDate: new Date()
                    }

                }).then(() => {
                    resolve()
                })
            }
            else {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        isCancelled: false
                    }
                }).then((response) => {
                    resolve()
                })

            }

        })
    },

    // get ordered product
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

    // total count of registered users
    getUsersCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            if (users) {
                count = users.length
                resolve(count)
            } else {
                resolve(count)
            }

        })
    },

    // total orders count
    totalOrders: () => {
        return new Promise(async (resolve, reject) => {
            let totalOrders = await db.get().collection(collection.ORDER_COLLECTION).count()
            resolve(totalOrders)
        })
    },

    // total products count
    totalProducts: () => {
        return new Promise(async (resolve, reject) => {
            let totalProducts = await db.get().collection(collection.PRODUCT_COLLECTION).count()
            resolve(totalProducts)
        })
    },

    // cancelled orders count
    cancelTotal: () => {
        return new Promise(async (resolve, reject) => {
            let orderCancelled = await db.get().collection(collection.ORDER_COLLECTION).find({ isCancelled: true }).count()
            resolve(orderCancelled)
        })
    },

    //daily revenue
    dailyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let dailyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }

                ]).toArray()
                resolve(dailyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }
        })
    },

    // weekly revenue
    weeklyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let weeklyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }
                ]).toArray()
                resolve(weeklyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }

        })
    },

    // yearly revenue
    yearlyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let yearlyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {

                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7 * 4 * 12)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }

                ]).toArray()

                resolve(yearlyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }
        })
    },

    // total revenue
    totalRevenue: () => {
        return new Promise(async (resolve, reject) => {
            let totalRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "delivered"
                    }

                },
                {
                    $project: {
                        totalAmount: "$totalAmount"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray()
            resolve(totalRevenue[0].totalAmount)
        })
    },

    // get chart data
    getchartData: (req, res) => {

        return new Promise((resolve, reject) => {


            db.get().collection(collection.ORDER_COLLECTION).aggregate([
                { $match: { "status": "delivered" } },
                {
                    $project: {
                        date: { $convert: { input: "$_id", to: "date" } }, total: "$totalAmount"
                    }
                },
                {
                    $match: {
                        date: {
                            $lt: new Date(), $gt: new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * 365))
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: "$date" },
                        total: { $sum: "$total" }
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        total: "$total",
                        _id: 0
                    }
                }
            ]).toArray().then(result => {
                db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    { $match: { "status": "delivered" } },
                    {
                        $project: {
                            date: { $convert: { input: "$_id", to: "date" } }, total: "$totalAmount"
                        }
                    },
                    {
                        $match: {
                            date: {
                                $lt: new Date(), $gt: new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * 7))
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { $dayOfWeek: "$date" },
                            total: { $sum: "$total" }
                        }
                    },
                    {
                        $project: {
                            date: "$_id",
                            total: "$total",
                            _id: 0
                        }
                    },
                    {
                        $sort: { date: 1 }
                    }
                ]).toArray().then(weeklyReport => {
                    let obj = {
                        result, weeklyReport
                    }
                    resolve(obj)
                })
            })

        })
    },
    
    // monthly report
    monthlyReport: () => {
        return new Promise(async (resolve, reject) => {
            try{
            let start=new Date(new Date()-1000*60*60*24*30)
            let end = new Date()

            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } }).sort({ Date: -1, Time: -1 }).toArray()
            var i;
            for(i=0;i<orderSuccess.length;i++){
                orderSuccess[i].date=moment(orderSuccess[i].date).format('lll')
            }
            let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let orderSuccessLength = orderSuccess.length
            let orderTotalLength = orderTotal.length
            let orderFailLength = orderTotalLength - orderSuccessLength
            let total = 0
            let discount=0
            let razorpay = 0
            let cod = 0
            let paypal = 0
            let wallet=0
            
            for (let i = 0; i < orderSuccessLength; i++) {
                total = total + orderSuccess[i].totalAmount
                if (orderSuccess[i].paymentMethod === 'COD') {
                    cod++
                } else if (orderSuccess[i].paymentMethod === 'paypal') {
                    paypal++
                }else if (orderSuccess[i].paymentMethod === 'Razorpay') {
                    razorpay++
                }
                 else {
                    wallet++
                }
                 if (orderSuccess[i].discount) {
                    discount = discount + parseInt(orderSuccess[i].discount)
                    discount++
                }
            }

            let productCount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                       $and:[{status:{$nin:["cancelled"]}
                    },
                { date: { $gte: start, $lte: end }}]

                    },
                    
                },
                {
                    $project:{
                        _id:0,
                        quantity:'$products.quantity'
                        
                    }
                },
                {
                    $unwind:'$quantity'
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum:'$quantity' }
                    }
                }
              ]).toArray()

            var data = {
                start: moment(start).format('YYYY/MM/DD'),
                end: moment(end).format('YYYY/MM/DD'),
                totalOrders: orderTotalLength,
                successOrders: orderSuccessLength,
                failOrders: orderFailLength,
                totalSales: total,
                cod: cod,
                paypal: paypal,
                razorpay: razorpay,
                wallet:wallet,
                discount:discount,
                productCount:productCount[0].total,
               
                currentOrders: orderSuccess
            }
            resolve(data)
        }
        catch {
            resolve(0)
        }
      })
     },

    // get report
     getReport: (startDate,endDate) => {
        return new Promise(async (resolve, reject) => {
            try{
            let start=new Date(startDate)
            let end = new Date(endDate)
            
            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } }).sort({ Date: -1, Time: -1 }).toArray()
            let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let orderSuccessLength = orderSuccess.length
            let orderTotalLength = orderTotal.length
            let orderFailLength = orderTotalLength - orderSuccessLength
            let total = 0
            let discount=0

            let razorpay = 0
            let cod = 0
            let paypal = 0
            let wallet=0
            let productCount=0
            for (let i = 0; i < orderSuccessLength; i++) {
                total = total + orderSuccess[i].totalAmount
                if (orderSuccess[i].paymentMethod === 'COD') {
                    cod++
                } else if (orderSuccess[i].paymentMethod === 'paypal') {
                    paypal++
                }else if (orderSuccess[i].paymentMethod === 'Razorpay') {
                    razorpay++
                }
                 else {
                    wallet++
                }
                 if (orderSuccess[i].discount) {
                
                    discount = discount + parseInt(orderSuccess[i].discount)
                    discount++
                }
            }

             productCount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                       $and:[{status:{$nin:["cancelled"]}
                    },
                { date: { $gte: start, $lte: end }}]

                    },
                    
                },
                {
                    $project:{
                        _id:0,
                        quantity:'$products.quantity'
                        
                    }
                },
                {
                    $unwind:'$quantity'
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum:'$quantity' }
                    }
                }
              ]).toArray()

            var data = {
                start: moment(start).format('YYYY/MM/DD'),
                end: moment(end).format('YYYY/MM/DD'),
                totalOrders: orderTotalLength,
                successOrders: orderSuccessLength,
                failOrders: orderFailLength,
                totalSales: total,
                cod: cod,
                paypal: paypal,
                razorpay: razorpay,
                wallet:wallet,
                discount:discount,
                productCount:productCount[0].total,
                currentOrders: orderSuccess
            }
            resolve(data)
        }catch {
            resolve(0)
        }
      })
     },

dailyReport:()=>{
    return new Promise(async(resolve, reject) => {
        try{

        let start=new Date(new Date()-1000*60*60*24)
        let end = new Date()

        let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } }).sort({ Date: -1, Time: -1 }).toArray()
        
        let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
        let orderSuccessLength = orderSuccess.length
        let orderTotalLength = orderTotal.length
        let orderFailLength = orderTotalLength - orderSuccessLength
        let total = 0
        let discount=0
        let razorpay = 0
        let cod = 0
        let paypal = 0
        let wallet=0
        let productCount=0
        for (let i = 0; i < orderSuccessLength; i++) {
            total = total + orderSuccess[i].totalAmount
            if (orderSuccess[i].paymentMethod === 'COD') {
                cod++
            } else if (orderSuccess[i].paymentMethod === 'paypal') {
                paypal++
            }else if (orderSuccess[i].paymentMethod === 'Razorpay') {
                razorpay++
            }
             else {
                wallet++
            }
             if (orderSuccess[i].discount) {
            
                discount = discount + parseInt(orderSuccess[i].discount)
                discount++
            }
        }
        productCount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{
                   $and:[{status:{$nin:["cancelled"]}
                },
            { date: { $gte: start, $lte: end }}]

                },
                
            },
            {
                $project:{
                    _id:0,
                    quantity:'$products.quantity'
                    
                }
            },
            {
                $unwind:'$quantity'
            },
            {
                $group: {
                    _id: null,
                    total: { $sum:'$quantity' }
                }
            }
          ]).toArray()
        var data = {
            start: moment(start).format('YYYY/MM/DD'),
            end: moment(end).format('YYYY/MM/DD'),
            totalOrders: orderTotalLength,
            successOrders: orderSuccessLength,
            failOrders: orderFailLength,
            totalSales: total,
            cod: cod,
            paypal: paypal,
            razorpay: razorpay,
            wallet:wallet,
            discount:discount,
            productCount:productCount[0].total,
            averageRevenue:total/productCount[0].total, 
            currentOrders: orderSuccess
        }
        resolve(data)
    }catch {
        resolve(0)
    }
    })
 },

// weekly report
 weeklyReport:()=>{
    return new Promise(async(resolve, reject) => {
        try{
        
        let start=new Date(new Date()-1000*60*60*24*7)

        let end = new Date()
        
        let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } }).sort({ Date: -1, Time: -1 }).toArray()
        let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
        let orderSuccessLength = orderSuccess.length
        let orderTotalLength = orderTotal.length
        let orderFailLength = orderTotalLength - orderSuccessLength
        let total = 0
        let discount=0

        let razorpay = 0
        let cod = 0
        let paypal = 0
        let wallet=0
        let productCount=0
        for (let i = 0; i < orderSuccessLength; i++) {
            total = total + orderSuccess[i].totalAmount
            if (orderSuccess[i].paymentMethod === 'COD') {
                cod++
            } else if (orderSuccess[i].paymentMethod === 'paypal') {
                paypal++
            }else if (orderSuccess[i].paymentMethod === 'Razorpay') {
                razorpay++
            }
             else {
                wallet++
            }
             if (orderSuccess[i].discount) {
            
                discount = discount + parseInt(orderSuccess[i].discount)
                discount++
            }
        }

        productCount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{
                   $and:[{status:{$nin:["cancelled"]}
                },
            { date: { $gte: start, $lte: end }}]

                },
                
            },
            {
                $project:{
                    _id:0,
                    quantity:'$products.quantity'
                    
                }
            },
            {
                $unwind:'$quantity'
            },
            {
                $group: {
                    _id: null,
                    total: { $sum:'$quantity' }
                }
            }
          ]).toArray()

        var data = {
            start: moment(start).format('YYYY/MM/DD'),
            end: moment(end).format('YYYY/MM/DD'),
            totalOrders: orderTotalLength,
            successOrders: orderSuccessLength,
            failOrders: orderFailLength,
            totalSales: total,
            cod: cod,
            paypal: paypal,
            razorpay: razorpay,
            wallet:wallet,
            discount:discount,
            productCount:productCount[0].total,
            averageRevenue:total/productCount[0].total,
            
            currentOrders: orderSuccess
        }

        resolve(data)
    }catch {
        resolve(0)
    }
    })
 },

 // yearly report
 yearlyReport:()=>{
    return new Promise(async(resolve, reject) => {
        try{
        
        let start=new Date(new Date()-1000*60*60*24*365)

        let end = new Date()
        
        let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } }).sort({ Date: -1, Time: -1 }).toArray()
        let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
        let orderSuccessLength = orderSuccess.length
        let orderTotalLength = orderTotal.length
        let orderFailLength = orderTotalLength - orderSuccessLength
        let total = 0
        let discount=0

        let razorpay = 0
        let cod = 0
        let paypal = 0
        let wallet=0
        let productCount=0
        for (let i = 0; i < orderSuccessLength; i++) {
            total = total + orderSuccess[i].totalAmount
            if (orderSuccess[i].paymentMethod === 'COD') {
                cod++
            } else if (orderSuccess[i].paymentMethod === 'paypal') {
                paypal++
            }else if (orderSuccess[i].paymentMethod === 'Razorpay') {
                razorpay++
            }
             else {
                wallet++
            }
             if (orderSuccess[i].discount) {
            
                discount = discount + parseInt(orderSuccess[i].discount)
                discount++
            }
        }

        productCount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{
                   $and:[{status:{$nin:["cancelled"]}
                },
            { date: { $gte: start, $lte: end }}]

                },
                
            },
            {
                $project:{
                    _id:0,
                    quantity:'$products.quantity'
                    
                }
            },
            {
                $unwind:'$quantity'
            },
            {
                $group: {
                    _id: null,
                    total: { $sum:'$quantity' }
                }
            }
          ]).toArray()

        var data = {
            start: moment(start).format('YYYY/MM/DD'),
            end: moment(end).format('YYYY/MM/DD'),
            totalOrders: orderTotalLength,
            successOrders: orderSuccessLength,
            failOrders: orderFailLength,
            totalSales: total,
            cod: cod,
            paypal: paypal,
            razorpay: razorpay,
            wallet:wallet,
            discount:discount,
            productCount:productCount[0].total,

            averageRevenue:total/productCount[0].total,

            currentOrders: orderSuccess
        }
    
        resolve(data)
    }catch {
        resolve(0)
    }
       })
     }
}
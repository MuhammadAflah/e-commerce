var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers')
var db = require('../config/connection');
const productHelper = require('../helpers/product-helper')
var fs = require('fs');
const bannerHelper = require('../helpers/banner-helper')
const { route } = require('./users');

const couponHelper = require('../helpers/coupon-helper');
const offerHelper = require('../helpers/offer-helper');
const userHelpers = require('../helpers/user-helpers')

//setting layout for admin side seperate...
const setAdminLayout = (req, res, next) => {
    res.locals.layout = 'admin-layout'
    next()
}
// using admin layout...
router.use(setAdminLayout)

//admin login
const credentials = { email: process.env.email, password: process.env.password, name: process.env.name }

// Verify login
const verifyLogin = (req, res, next) => {
    if (req.session.admin) {
        next()
    } else {
        res.redirect('/admin/admin-login')
    }
}

// home
router.get('/', verifyLogin, async function (req, res, next) {
    let adminsession = req.session.admin
    let userCount = await adminHelpers.getUsersCount()
    let orderCount = await adminHelpers.totalOrders()
    let productCount = await adminHelpers.totalProducts()
    let cancelCount = await adminHelpers.cancelTotal()
    let dailyRevenue = await adminHelpers.dailyRevenue()
    let totalRevenue = await adminHelpers.totalRevenue()
    let weeklyRevenue = await adminHelpers.weeklyRevenue()
    let yearlyRevenue = await adminHelpers.yearlyRevenue()
    res.render('admin/dashboard', { admin: true, adminsession, userCount, orderCount, productCount, cancelCount, dailyRevenue, totalRevenue, weeklyRevenue, yearlyRevenue })
})

router.get('/sales-management', verifyLogin, async (req, res) => {
    let data = await adminHelpers.monthlyReport()
    let daily = await adminHelpers.dailyReport()
    let weekly = await adminHelpers.weeklyReport()
    let yearly = await adminHelpers.yearlyReport()
    res.render('admin/sales-management', { admin: true, adminsession: req.session.admin, data, daily, weekly, yearly })
})

router.post('/custom-report', verifyLogin, async (req, res) => {
    let start = req.body.starting
    let end = req.body.ending
    console.log(start);
    console.log(end);
    let data = await adminHelpers.getReport(start, end)
    let daily = await adminHelpers.dailyReport()
    let weekly = await adminHelpers.weeklyReport()
    let yearly = await adminHelpers.yearlyReport()
    res.render('admin/sales-management', { admin: true, adminsession: req.session.admin, data, daily, weekly, yearly })

})

// admin-login
router.get('/admin-login', (req, res, next) => {
    // let admin=req.session.admin
    if (req.session.admin) {
        res.redirect('/admin')
    } else {
        res.render('admin/admin-login', { admin: true, adminLoginError: req.session.adminLoginError })
        req.session.adminLoginError = false
    }
})
router.post('/admin-login', (req, res) => {
    if (credentials.email == req.body.email && credentials.password == req.body.password) {
        req.session.loggedIn = true
        req.session.admin = req.body
        req.session.admin.name = credentials.name
        res.redirect('/admin')
    } else {
        req.session.adminLoginError = "Invalid email or password"
        res.redirect('/admin/admin-login')
    }
})

// add product
router.get('/add-product', verifyLogin, (req, res, next) => {
    let adminsession = req.session.admin
    adminHelpers.getAllCategories().then((allcategories) => {
        res.render('admin/add-product', { admin: true, adminsession, allcategories, productRepeatError: req.session.productRepeatError })
        req.session.productRepeatError = false
    })
})
router.post('/add-product', verifyLogin, function (req, res, next) {
    productHelper.addProduct(req.body).then((response) => {
        console.log('hiii');
        console.log(response);
        let id = response.insertedId
        console.log(id);
        let image1 = req.files.image1
        let image2 = req.files.image2
        let image3 = req.files.image3
        let image4 = req.files.image4
        image1.mv('./public/product-images/' + id + '1.jpg')
        image2.mv('./public/product-images/' + id + '2.jpg')
        image3.mv('./public/product-images/' + id + '3.jpg')
        image4.mv('./public/product-images/' + id + '4.jpg')
        res.redirect('/admin/product-management')
    }).catch(() => {
        req.session.productRepeatError = "product already added!!"
        res.redirect('/admin/add-product')
    })
})

// add category
router.get('/add-category', verifyLogin, (req, res) => {
    let adminsession = req.session.admin
    res.render('admin/add-category', { admin: true, categoryRepeatError: req.session.categoryRepeatError, adminsession })
    req.session.categoryRepeatError = false
})
router.post('/add-category', (req, res) => {
    adminHelpers.addCategory(req.body).then((response) => {
        // console.log(response);
        if (response.status) {
            res.redirect('/admin/category-management')
        } else {
            req.session.categoryRepeatError = "category already inserted"
            res.redirect('/admin/add-category')
        }
    })
})

// category management
router.get('/category-management', verifyLogin, (req, res) => {
    let adminsession = req.session.admin;
    adminHelpers.getAllCategories().then((allcategories) => {
        res.render('admin/category-management', { admin: true, allcategories, adminsession, categoryProductExistError: req.session.categoryProductExistError })
        req.session.categoryProductExistError = false
    })
})

//user management
router.get('/user-management', verifyLogin, (req, res, next) => {
    let adminsession = req.session.admin
    adminHelpers.getAllUsers().then((allUsers) => {
        res.render('admin/user-management', { admin: true, allUsers, adminsession })
    })
})

// block user
router.get('/block-user/:_id', verifyLogin, (req, res) => {
    let id = req.params._id
    console.log(id);
    adminHelpers.blockUser(id).then((response) => {
        console.log(response);
        res.redirect('/admin/user-management')
    })
})

// unblock user
router.get('/unblock-user/:_id', verifyLogin, (req, res) => {
    let id = req.params._id
    adminHelpers.unblockUser(id).then((response) => {
        res.redirect('/admin/user-management')
    })
})

// product management
router.get('/product-management', verifyLogin, (req, res, next) => {
    let adminsession = req.session.admin
    productHelper.getAllProducts().then((allproducts) => {
        res.render('admin/product-management', { allproducts, admin: true, adminsession, proDeleteError: req.session.proDeleteError })
        req.session.proDeleteError = false
    })
})

// delete category
router.get('/delete-category/:_id/:category', verifyLogin, (req, res) => {
    let id = req.params._id
    adminHelpers.deleteCategory(id, req.params.category).then((response) => {
        res.redirect('/admin/category-management')
    }).catch(() => {
        req.session.categoryProductExistError = true;
        res.redirect('/admin/category-management')
    })
})

// edit category
router.get('/edit-category/:id', verifyLogin, async (req, res) => {
    let adminSession = req.session.admin
    let catagoryDetails = await adminHelpers.getCategory(req.params.id)
    res.render('admin/edit-category', {
        admin: true,
        validation: true,
        catagoryDetails,
        adminSession,
        catagoryErr: req.session.catagoryErr
    })
    req.session.catagoryErr = false
})
router.post('/edit-category', verifyLogin, async (req, res) => {
    let categoryData = req.body
    await adminHelpers.editCategory(categoryData).then((response) => {
        console.log(response);
        if (response.status) {
            res.redirect('/admin/category-management')
        } else {
            req.session.catagoryErr = "This Item Already Exists"
            res.redirect('/admin/edit-category/' + categoryData.id)
        }
    })
})

// delete product
router.get('/delete-product/:id', verifyLogin, (req, res) => {
    let id = req.params.id
    console.log(id);
    productHelper.deleteProduct(id).then(() => {
        res.redirect('/admin/product-management')
        fs.unlinkSync('public/product-images/' + id + '1.jpg')
        fs.unlinkSync('public/product-images/' + id + '2.jpg')
        fs.unlinkSync('public/product-images/' + id + '3.jpg')
        fs.unlinkSync('public/product-images/' + id + '4.jpg')
    }).catch(() => {
        req.session.proDeleteError = "product in cart"
        res.redirect('/admin/product-management')
    })
})

//edit product
router.get('/edit-product/:id', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let id = req.params.id
    let allCategories = await adminHelpers.getAllCategories()
    productHelper.getProductDetails(id).then((productDetails) => {
        res.render('admin/edit-product', { admin: true, productDetails, allCategories, adminsession })
    })
})
router.post('/edit-product', (req, res) => {
    let id = req.body._id
    productHelper.editProduct(req.body).then(() => {
        try {
            if (req.files.image1) {
                let image1 = req.files.image1
                image1.mv('./public/product-images/' + id + '1.jpg')
            }
            if (req.files.image2) {
                let image2 = req.files.image2
                image2.mv('./public/product-images/' + id + '2.jpg')
            }
            if (req.files.image3) {
                let image3 = req.files.image3
                image3.mv('./public/product-images/' + id + '3.jpg')
            }
            if (req.files.image4) {
                let image4 = req.files.image4
                image4.mv('./public/product-images/' + id + '4.jpg')
            }
            res.redirect('/admin/product-management')
        } catch {
            res.redirect('/admin/product-management')
        }
    })
})

// view product details
router.get('/view-product/:id', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    await productHelper.getProductDetails(req.params.id).then((response) => {
        let productDetails = response
        res.render('admin/view-product', { admin: true, adminsession, productDetails })
    })
})

// all orders
router.get('/all-orders', verifyLogin, (req, res) => {
    let adminsession = req.session.admin
    adminHelpers.getAllUsersName().then((response) => {
        let allOrderDetails = response
        res.render('admin/all-orders', { admin: true, adminsession, allOrderDetails })
    })
})

// order status
router.post('/order-status', verifyLogin, (req, res) => {
    let status = req.body.status
    let orderId = req.body.orderId
    adminHelpers.orderStatusChange(status, orderId).then(() => {
        res.redirect('/admin/all-orders')
    })
})

// order details
router.get('/view-order-details/:id', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin;
    let products = await adminHelpers.getOrderProducts(req.params.id)
    let orders = await userHelpers.getOrderDetails(req.params.id)
    res.render('admin/view-order-details', { admin: true, adminsession, products, orders })
})


//admin signup
router.get('/admin-signup', (req, res, next) => {
    let adminsession = req.session.admin
    res.render('admin/admin-signup', { admin: true, addadminError: req.session.addadminError, adminsession })
    req.session.addadminError = false
})
router.post('/admin-signup', verifyLogin, (req, res) => {
    adminHelpers.addAdmin(req.body).then((response) => {
        if (response) {
            res.redirect('/admin')
        } else {
            req.session.addadminError = "email already exist"
            res.redirect('/admin/admin-signup')
        }
    })
})

// banner management
router.get('/banner-management', verifyLogin, (req, res, next) => {
    let adminsession = req.session.admin
    bannerHelper.getAllBanners().then((allbanners) => {
        res.render('admin/banner-management', { allbanners, admin: true, adminsession })
    })
})

// add banner
router.get('/add-banner', verifyLogin, (req, res, next) => {
    let adminsession = req.session.admin
    res.render('admin/add-banner', { admin: true, adminsession })
})
router.post('/add-banner', verifyLogin, (req, res) => {
    console.log(req.body);
    bannerHelper.addBanner(req.body).then((response) => {
        let id = response.insertedId
        let image = req.files.image
        image.mv('./public/banner-images/' + id + '1.jpg')
        res.redirect('/admin/banner-management')
    }).catch(() => {
        req.session.bannerRepeatError = "Banner already added!!"
        res.redirect('/admin/add-banner')
    })
})

// edit banner
router.get('/edit-banner/:id', verifyLogin, (req, res) => {
    let adminsession = req.session.admin
    let id = req.params.id
    bannerHelper.getBannerDetails(id).then((bannerDetails) => {
        console.log(bannerDetails);
        res.render('admin/edit-banner', { admin: true, bannerDetails, adminsession })
    })
})
router.post('/edit-banner', (req, res) => {
    let id = req.body._id
    bannerHelper.editBanner(req.body).then(() => {
        if (req.files.image) {
            let image = req.files.image
            image.mv('./public/banner-images/' + id + '1.jpg')
        }
        res.redirect('/admin/banner-management')
    })
})

// delete banner
router.get('/delete-banner/:id', verifyLogin, (req, res) => {
    let id = req.params.id
    bannerHelper.deleteBanner(id).then(() => {
        res.redirect('/admin/banner-management')
        fs.unlinkSync('public/banner-images/' + id + '1.jpg')
    })
});

// chart data
router.get('/chart-data', verifyLogin, (req, res) => {
    adminHelpers.getchartData().then((obj) => {
        let result = obj.result
        let weeklyReport = obj.weeklyReport
        res.json({ data: result, weeklyReport })
    })
})
// sales report
router.get('/sales-report', verifyLogin, (req, res) => {
    let adminsession = req.session.admin
    adminHelpers.getAllUsersName().then((response) => {
        let salesReport = response
        res.render('admin/sales-report', { admin: true, adminsession, salesReport })
    })
})

//coupon management
router.get('/coupon-management', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let allCoupons = await couponHelper.getAllCoupons()
    res.render('admin/coupon-management', { admin: true, adminsession, couponExist: req.session.couponExist, allCoupons })
    req.session.couponExist = false;
})

//add coupon
router.post('/add-coupon', verifyLogin, (req, res) => {
    // console.log(req.body.coupon);
    console.log();
    couponHelper.addCoupon(req.body).then(() => {
        res.redirect('/admin/coupon-management')
    }).catch(() => {
        req.session.couponExist = "coupon already exists !!!"
        res.redirect('/admin/coupon-management')
    })

})

//edit coupon
router.get('/edit-coupon/:_id', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let couponId = req.params._id
    let couponDetails = await couponHelper.getCouponDetails(couponId)
    res.render('admin/edit-coupon', { admin: true, adminsession, couponDetails })
})
router.post('/edit-coupon/:_id', verifyLogin, (req, res) => {
    let couponId = req.params._id
    let data = req.body
    couponHelper.editCoupon(data, couponId).then(() => {
        console.log('edited succesfully');
        res.redirect('/admin/coupon-management')
    })
})

//delete coupon
router.get('/delete-coupon/:_id', verifyLogin, (req, res) => {
    let couponId = req.params._id
    couponHelper.deleteCoupon(couponId).then(() => {
        res.redirect('/admin/coupon-management')
    })
})

//product offer management
router.get('/product-offers', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let allProducts = await productHelper.getAllProducts()
    let prodOffers = await offerHelper.getAllProductOffers()
    res.render('admin/product-offers', { admin: true, adminsession, allProducts, prodOffers, proOfferExists: req.session.proOfferExists })
    req.session.proOfferExists = false
})
router.post('/product-offers', verifyLogin, async (req, res) => {
    offerHelper.addProductOffer(req.body).then(() => {
        res.redirect('/admin/product-offers')
    }).catch(() => {
        req.session.proOfferExists = "An offer alredy added to this product"
        res.redirect('/admin/product-offers')
    })
})

//edit prod offer
router.get('/edit-product-offer/:_id', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let proOfferId = req.params._id
    let proOfferDetails = await offerHelper.getProdOfferDetails(proOfferId)
    res.render('admin/edit-product-offer', { admin: true, adminsession, proOfferDetails })
})
router.post('/edit-product-offer/:_id', verifyLogin, (req, res) => {
    let proOfferId = req.params._id
    offerHelper.editProdOffer(proOfferId, req.body).then(() => {
        res.redirect('/admin/product-offers')
    })
})

//delete prod offer
router.get('/delete-prodOffer/:_id', verifyLogin, (req, res) => {
    let proOfferId = req.params._id
    offerHelper.deleteProdOffer(proOfferId).then(() => {
        res.redirect('/admin/product-offers')
    })
})

// category offer management
router.get('/category-offers', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let allCategories = await offerHelper.getAllCategories()
    let CatOffers = await offerHelper.getAllCatOffers()
    res.render('admin/category-offers', { admin: true, adminsession, allCategories, CatOffers, catOfferExist: req.session.catOfferExist })
    req.session.catOfferExist = false
})
router.post('/category-offers', verifyLogin, (req, res) => {
    offerHelper.addCatOffer(req.body).then(() => {
        res.redirect('/admin/category-offers')
    }).catch(() => {
        req.session.catOfferExist = "An offer already added to this category!!"
        res.redirect('/admin/category-offers')
    })
})

// edit category offer
router.get('/edit-catOffer/:_id', verifyLogin, async (req, res) => {
    let adminsession = req.session.admin
    let catOfferId = req.params._id
    let catOfferDetails = await offerHelper.getCatOfferDetails(catOfferId)
    res.render('admin/edit-catOffer', { admin: true, adminsession, catOfferDetails })
})
router.post('/edit-catOffer/:_id', verifyLogin, (req, res) => {
    let catOfferId = req.params._id
    offerHelper.editCatOffer(catOfferId, req.body).then(() => {
        res.redirect('/admin/category-offers')
    })
})

// delete category offer
router.get('/delete-catOffer/:_id', verifyLogin, async (req, res) => {
    let catOfferId = req.params._id
    await offerHelper.deleteCatOffer(catOfferId)
    res.redirect('/admin/category-offers')
})

// admin logout
router.get('/admin-logout', (req, res) => {
    req.session.admin = null
    res.redirect('/admin/admin-login')
})

module.exports = router;
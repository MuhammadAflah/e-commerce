var express = require('express');
const { response } = require('../app');
var router = express.Router();
var db = require('../config/connection')
var collection = require('../config/collection')
const userHelpers = require('../helpers/user-helpers');
const productHelper = require('../helpers/product-helper');
const adminHelpers = require('../helpers/admin-helpers');
const wishlistHelper = require('../helpers/wishlist-helper');
const bannerHelper = require('../helpers/banner-helper');
const couponHelper = require('../helpers/coupon-helper');
const offerHelper = require('../helpers/offer-helper');
const moment = require('moment');
var objectId = require('mongodb').ObjectId

// twilio credentials
const serviceSID = process.env.SERVICE_SID
const accountSID = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSID, authToken)

// verify login
const verifyLogin = async (req, res, next) => {
  if (req.session.user) {
    await userHelpers.isBlockedUser(req.session.user.email).then((response) => {
      if (response.isBlocked) {
        req.session.user = null
        res.redirect('/login')
      } else {
        next();
      }
    })
  } else {
    req.session.redirectUrl = req.originalUrl
    res.redirect("/login");
  }
};

// home page
router.get('/', async (req, res, next) => {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let wishlistCount = null
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  let todayDate = new Date().toISOString().slice(0, 10);
  let startProOffer = await offerHelper.startProductOffer(todayDate);
  let startCatOffer = await offerHelper.startCategoryOffer(todayDate)
  let startCouponOffer = await couponHelper.startCouponOffer(todayDate)
  bannerHelper.getAllBanners().then((allBanners) => {
    productHelper.getAllProducts().then((products) => {
      productHelper.getAllProducts().then(async (allProducts) => {
        res.render('user/index', { user, products, cartCount, allBanners, wishlistCount, allProducts, startCatOffer, startProOffer })
      })
    })
  })

});

// user signup
router.get('/signup', (req, res, next) => {
  res.render('user/signup', { signupError: req.session.signupError })
  req.session.signupError = false
});
router.post('/signup', (req, res, next) => {
  userHelpers.signup(req.body).then((response) => {
    if (response) {

      res.redirect('/login')
    } else {
      req.session.signupError = "email already exists!!"
      res.redirect('/signup')
    }
  })
})

// user login
router.get('/login', (req, res, next) => {
  let user = req.session.user
  if (user) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginError": req.session.loginError, "blockError": req.session.blockError, "otpLoginError": req.session.otpLoginError, "userBlockError": req.session.userBlockError })
    req.session.loginError = false
    req.session.blockError = false
    req.session.otpLoginError = false
    req.session.userBlockError = false
  }
})
router.post('/login', function (req, res, next) {
  userHelpers.login(req.body).then((response) => {
    if (response.isBlocked) {
      req.session.blockError = "You are blocked!!"
      res.redirect("/login")
    } else {
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        if (req.session.redirectUrl) {
          res.redirect(req.session.redirectUrl);
        } else {
          res.redirect('/')
        }
      } else {
        req.session.loginError = "invalid email or password"
        res.redirect('/login')
      }
    }

  })
})

// otp login
router.get('/otp-login', (req, res) => {
  if (req.session.user) {
    res.redirect('/enter-otp')
  } else {
    res.render('user/otp-login', { "otpLoginError": req.session.otpLoginError })
    req.session.otpLoginError = false
  }
})
router.post('/otp-login', async (req, res) => {
  let user = await userHelpers.verifyMobile(req.body.phone)
  await userHelpers.verifyMobile(req.body.phone).then((response) => {
    if (user) {
      if (response.isBlocked) {
        req.session.userBlockError = "user is blocked!!"
        res.redirect('/login')
      } else {
        client.verify
          .services(serviceSID)
          .verifications.create({
            to: `+91${req.body.phone}`,
            channel: "sms"
          }).then((response) => {
            res.render('user/enter-otp', { phone: req.body.phone })
          }).catch(() => {
            console.log('failed!!');
          })
      }

    } else {
      req.session.otpLoginError = "Entered mobile number is not registered!!"
      res.redirect('/login')
    }
  })

})

// enter otp
router.get('/enter-otp', (req, res) => {
  let user = req.session.user
  res.render('user/enter-otp', { invalidOtpError: req.session.invalidOtpError, user })
  req.session.invalidOtpError = false
})
router.post('/enter-otp', (req, res) => {
  let otp = req.body.otp
  let phone = req.body.phone
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${phone}`,
      code: otp
    }).then((response) => {
      let valid = response.valid
      if (valid) {
        userHelpers.verifyMobile(phone).then((response) => {
          req.session.loggedIn = true
          req.session.user = response
          res.redirect('/')
        })

      } else {
        req.session.invalidOtpError = "Invalid otp"
        res.redirect('/enter-otp')
      }
    }).catch((err) => {
      console.log(err);
    })
})

//product-details
router.get("/product-details", async (req, res) => {
  let user = req.session.user;
  if (user) {
    let allCategories = await adminHelpers.getAllCategories()
    let categoryDetails = await productHelper.allCategory();
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    let wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
    let allProducts = await productHelper.getAllProducts();
    allProducts.forEach(async (element) => {
      if (element.stock <= 5 && element.stock != 0) {
        element.fewStock = true;
      } else if (element.stock == 0) {
        element.noStock = true;
      }
    });
    // let categoryDetails = await productHelper.allCategory();
    let todayDate = new Date().toISOString().slice(0, 10);
    let startProOffer = await offerHelper.startProductOffer(todayDate);
    let startCatOffer = await offerHelper.startCategoryOffer(todayDate);
    await couponHelper.startCouponOffer(todayDate);
    res.render("user/product-details", {
      allProducts,
      user,
      categoryDetails,
      allCategories,
      cartCount,
      wishlistCount,
      startProOffer,
      startCatOffer
    });
  } else {
    let allCategories = await adminHelpers.getAllCategories()
    let allProducts = await productHelper.getAllProducts();
    allProducts.forEach(async (element) => {
      if (element.stock <= 5 && element.stock != 0) {
        element.fewStock = true;
      } else if (element.stock == 0) {
        element.noStock = true;
      }
    });
    let categoryDetails = await productHelper.allCategory();
    let todayDate = new Date().toISOString().slice(0, 10);
    await offerHelper.startProductOffer(todayDate);
    await offerHelper.startCategoryOffer(todayDate);
    await couponHelper.startCouponOffer(todayDate);
    res.render("user/product-details", {
      allProducts,
      categoryDetails,
      allCategories
    });
  }
});

// single product details
router.get('/product/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let proId = req.params.id
  let cartCount = null
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishlistCount = null
  wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  let todayDate = new Date().toISOString().slice(0, 10);
  let startProOffer = await offerHelper.startProductOffer(todayDate);
  let startCatOffer = await offerHelper.startCategoryOffer(todayDate)
  productHelper.getProductDetails(proId).then((response) => {
    let productDetails = response
    if (productDetails.stock < 5 && productDetails.stock != 0) {
      productDetails.fewStock = true
    } else if (productDetails.stock == 0) {
      productDetails.noStock = true
    } else {
      productDetails.stock = true
    }

    res.render('user/product', { zoom: true, productDetails, user, cartCount, wishlistCount, startProOffer, startCatOffer })
  })
})

// cart
router.get('/cart', async (req, res) => {
  try {
    let user = req.session.user._id
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let cartCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    let wishlistCount = null
    if (req.session.user) {
      wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
    }
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    let todayDate = new Date().toISOString().slice(0, 10);
    let startProOffer = await offerHelper.startProductOffer(todayDate);
    let startCatOffer = await offerHelper.startCategoryOffer(todayDate)
    res.render('user/cart', { products, user, cartCount, total, wishlistCount, startProOffer, startCatOffer })
  } catch (err) {
    res.redirect('/login')
  }
})

// add to cart
router.get('/add-to-cart/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let count =await userHelpers.findProCount(req.session.user._id, req.params.id)
  let stock = await productHelper.findStock(req.params.id);
  console.log('stock count===', stock);
  if (stock.stock == count) {
    res.json({ noStock : true })
  } else {
    if (user) {
      userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: "add" })
      })
    } else {
      res.json({ status: "login" })
    }
  }
})

// change product quantity
router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  let userId = req.body.user;
  let proId = req.body.product;
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    response.cartSubTotal = await userHelpers.getCartSubTotal(userId, proId)
    res.json(response)
  }).catch(() => {
    res.json({ noStock: true })
  })
})

//delete cart item
router.get('/delete-cart-item/:cartId/:proId', verifyLogin, (req, res) => {
  let cartId = req.params.cartId
  let proId = req.params.proId
  userHelpers.deleteCartItem(cartId, proId).then(() => {
    res.redirect('/cart')
  })
})

// place order
router.get('/place-order', verifyLogin, async (req, res) => {
  let user = req.session.user
  let todayDate = new Date().toISOString().slice(0, 10);
  // let startCatOffer=await offerHelper.startCategoryOffer(todayDate)
  let startCouponOffer = await couponHelper.startCouponOffer(todayDate)
  let userAddress = await userHelpers.getAddress(req.session.user._id)
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let wishlistCount = null
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let wallet = await userHelpers.getWalletAmount(req.session.user._id)
  let showWallet = false
  if (wallet >= total) {
    showWallet = true
  }
  res.render('user/checkout', { total, user, cartCount, userAddress, wishlistCount, startCouponOffer, showWallet })
})

// place order
router.post("/place-order", verifyLogin, async (req, res) => {
  console.log(req.body);
  var totalAmount = await userHelpers.getTotalAmount(req.session.user._id);
  let products = await userHelpers.getCartProductList(req.body.userId)
  if (req.session.couponTotal) {
    totalAmount = req.session.couponTotal;
  }
  if (req.body.paymentMethod) {
    userHelpers.placeOrder(req.body, products, totalAmount).then((orderId) => {
      if (req.body.paymentMethod === "COD") {
        req.session.couponTotal = null;
        res.json({ codSuccess: true });
      } else if (req.body.paymentMethod === "paypal") {
        req.session.couponTotal = null;
        userHelpers.generatePaypal(orderId, totalAmount).then((link) => {
          res.json({ link, paypal: true });
        });
      } else if (req.body.paymentMethod === "wallet") {
        req.session.couponTotal = null;
        console.log('wallet');
        userHelpers.reduceWallet(req.session.user._id, totalAmount).then(() => {
          res.json({ wallet: true });
        });
      } else if (req.body.paymentMethod === "Razorpay") {
        console.log('razorpay');
        userHelpers.generateRazorpay(orderId, totalAmount).then((response) => {
          req.session.couponTotal = null;
          res.json(response);
        });
      } else {
        res.json(false);
      }
    });
  } else {
    res.json(false);
  }
});

// order placed
router.get('/order-placed', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let wishlistCount = null
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  res.render('user/order-placed', { user, order_placed: true })
})

//orders
router.get('/orders', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let wishlistCount = null
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/orders', { user, orders, cartCount, wishlistCount, products })
})

// view ordered products
router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let orderId = req.params.id
  let cartCount = null
  let wishlistCount = null
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  let products = await userHelpers.getOrderProducts(req.params.id)
  let orders = await userHelpers.getOrderDetails(orderId)
  let track = await userHelpers.statusTrack(orderId)
  track.date = moment(track.date).format('lll')
  track.shippedDate = moment(track.shippedDate).format('lll')
  track.OutForDeliveryDate = moment(track.OutForDeliveryDate).format('lll')
  track.deliverdDate = moment(track.deliverdDate).format('lll')
  track.cancellDate = moment(track.cancellDate).format('lll')
  track.returnedDate = moment(track.returnedDate).format('lll')
  res.render('user/view-order-products', { user, products, cartCount, wishlistCount, orders, track })
})

// profile
router.get("/profile", verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishlistCount = null
  wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  let userDetails = await userHelpers.getUserDetails(req.session.user._id)
  let wallet = await userHelpers.findWallet(req.session.user._id);
  wallet = wallet.wallet
  referralCode = userDetails.referralCode
  res.render("user/profile", { user, cartCount, wishlistCount, wallet, referralCode, userDetails, passwordError: req.session.passwordError, passwordChanger: req.session.passwordChanger });
  req.session.passwordError = false
  req.session.passwordChanger = false
});

// add address
router.post("/add-address", verifyLogin, (req, res) => {
  let address = req.body;
  let userId = req.session.user._id;
  userHelpers.addAddress(address, userId).then(() => {
    res.redirect("/profile");
  });
});

//edit address
router.post('/edit-address', verifyLogin, (req, res) => {
  let userId = req.session.user._id
  userHelpers.editAddress(req.body, userId).then((response) => {
    res.json({ status: true })
  })
})

// edit profile
router.post("/edit-profile", verifyLogin, (req, res) => {
  userHelpers.editProfile(req.body).then(() => {
    res.redirect("/profile");
  });
});

// delete address
router.get("/delete-address/:id", (req, res) => {
  let userId = req.session.user._id;
  userHelpers.deleteAddress(userId, req.params.id);
  res.redirect("/profile");
});

// change password
router.post('/change-password', verifyLogin, (req, res) => {
  userHelpers.changePassword(req.session.user._id, req.body).then((response) => {
    req.session.changePassword = true
    res.redirect('/profile')
  }).catch(() => {
    req.session.passwordError = 'invalid password';
    res.redirect('/profile')
  })
})

// add to wishlist
router.get('/add-to-wishlist/:id', verifyLogin, (req, res) => {
  let user = req.session.user
  let proId = req.params.id
  let userId = req.session.user._id
  wishlistHelper.addToWishlist(userId, proId, user).then(() => {
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})

// wishlist
router.get('/wishlist', verifyLogin, async (req, res) => {
  let user = req.session.user
  let userId = req.session.user._id
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let wishlistCount = null
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  let products = await wishlistHelper.getWishlistProducts(req.session.user._id)
  res.render('user/wishlist', { userId, products, user, cartCount, wishlistCount })
})

// delete wishlist item
router.get('/delete-wish-item/:proId', verifyLogin, (req, res) => {
  let user = req.session.user._id
  wishlistHelper.deleteWishItem(req.params.proId, user).then(() => {
    res.json({ status: true })
  })
})

// verify payment
router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })
})

// sorting
router.post('/sort', async (req, res) => {
  var user = req.session.user
  if (req.body.sortby == 'Pricelow') {
    await productHelper.sortProductasc().then((response) => {
      ascSortProduct = response
      res.render('user/product-details', { ascSortProduct, user })
    })
  }
  if (req.body.sortby == 'Pricehigh') {
    await productHelper.sortProductdesc().then((response) => {
      descSortProduct = response
      res.render('user/product-details', { descSortProduct, user })
    })
  }
})

// invoice
router.get('/invoice/:id', verifyLogin, async (req, res) => {
  let user = req.session.user
  let orderId = req.params.id
  let invoice = await userHelpers.getUserInvoice(req.params.id)
  let products = await userHelpers.getOrderProducts(req.params.id)
  let orders = await userHelpers.getOrderDetails(orderId)
  res.render('user/invoice', { user, invoice, products, orders })
})

// track
router.get('/status-track/:id', async (req, res) => {
  let user = req.session.user;
  await userHelpers.statusTrack(req.params.id).then((track) => {
    res.render('user/status-track', { track, user })
  })
})

// cancel order
router.get("/cancel-order/:id", verifyLogin, async (req, res) => {
  let orderId = req.params.id;
  let id = req.session.user._id;
  userHelpers.cancelOrder(orderId).then(async () => {
    let wallet = await userHelpers.findWallet(req.session.user._id);
    let order = await userHelpers.getOrder(orderId);
    if (order) {
      if (order.paymentMethod == "COD") {
        res.redirect("/orders");
      } else {
        if (wallet.wallet) {
          var amount = order.totalAmount + wallet.wallet
        } else {
          var amount = order.totalAmount
        }

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
                  },
                }
              )
              .then(() => {
                res.redirect("/orders");
              });
          });
      }
    }
  });
});

// return order
router.get("/return-order/:id", verifyLogin, async (req, res) => {
  let orderId = req.params.id;
  let id = req.session.user._id;
  userHelpers.returnOrder(orderId).then(async () => {
    let wallet = await userHelpers.findWallet(req.session.user._id);
    let order = await userHelpers.getOrder(orderId);
    if (order) {
      if (order.paymentMethod == "COD") {
        res.redirect("/orders");
      } else {
        if (wallet.wallet) {
          var amount = order.totalAmount + wallet.wallet
        } else {
          var amount = order.totalAmount
        }

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
                  },
                }
              )
              .then(() => {
                res.redirect("/orders");
              });
          });
      }
    }
  });
});

// coupen apply
router.post('/coupon-apply', async (req, res) => {
  let couponCode = req.body.coupon
  let userId = req.session.user._id
  let totalPrice = await userHelpers.getTotalAmount(userId);
  couponHelper.validateCoupon(couponCode, userId, totalPrice).then((response) => {
    req.session.couponTotal = response.total
    if (response.success) {
      res.json({ couponSuccess: true, total: response.total, discountValue: response.discountValue, couponCode })
    } else if (response.couponUsed) {
      res.json({ couponUsed: true })
    } else if (response.couponExpired) {
      res.json({ couponExpired: true })
    } else {
      res.json({ invalidCoupon: true })
    }

  })
})

// view category wise products
router.get('/view-catwise/:category', async (req, res) => {
  let category = req.params.category
  let allCategories = await adminHelpers.getAllCategories()
  let catWiseProducts = await productHelper.getCatWiseProduct(category)
  try {
    let userId = req.session.user._id
    let wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.render('user/catWise-products', { user: req.session.user, catWiseProducts, allCategories, wishlistCount, cartCount, userId })
  } catch {
    res.render('user/catWise-products', { catWiseProducts, allCategories })

  }
})

// contact
router.get("/contact", verifyLogin, async(req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  let wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  res.render("user/contact", {user, cartCount, wishlistCount})
})

// edit profile pic 
router.post("/edit-profile-pic", verifyLogin, (req, res) => {
  let image = req.files.image;
  let id = req.session.user._id;
  image.mv("./public/profile-images/" + id + ".jpg");
  res.redirect("/profile");
});

// user logout
router.get('/logout', (req, res, next) => {
  req.session.user = null;
  res.redirect('/login')
})

module.exports = router;

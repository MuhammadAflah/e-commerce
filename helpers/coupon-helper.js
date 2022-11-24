var db = require('../config/connection')
var bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
var collection = require('../config/collection')
const { resolve, reject } = require('promise')
const moment = require('moment')
var objectId = require('mongodb').ObjectId

module.exports = {

  // get all coupon
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(coupons);
    });
  },

  // start coupon date
  startCouponOffer: (date) => {
    let couponStartDate = new Date(date)
    return new Promise(async (resolve, reject) => {
      let coupons = await db.get().collection(collection.COUPON_COLLECTION).find({ startDateIso: { $lte: couponStartDate } }).toArray()
      if (coupons) {
        console.log(coupons);
        console.log("coupon unddd");
        await coupons.map(async (coupon) => {
          await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: objectId(coupon._id) }, {
            $set: {
              available: true
            }
          }).then(() => {
            resolve()
          })
        })
      } else {
        console.log("coupon illa");
        resolve()
      }

    })
  },

  // add new coupon
  addCoupon: (data) => {
    console.log('----------------------------------------------');
    console.log(data.coupon);
    console.log(typeof (data.coupon));
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ coupon: data.coupon });
      if (coupon) {
        reject();
      } else {
        let startDateIso = new Date(data.starting);
        let endDateIso = new Date(data.expiry);
        let expiry = await moment(data.expiry).format("YYYY-MM-DD");
        let starting = await moment(data.starting).format("YYYY-MM-DD");
        let couponObj = await {
          coupon: data.coupon,
          offer: parseInt(data.couponPercentage),
          starting: starting,
          expiry: expiry,
          startDateIso: startDateIso,
          endDateIso: endDateIso,
          users: [],
        };
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .insertOne(couponObj)
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      }
    });
  },

  // get coupon details
  getCouponDetails: (couponId) => {
    return new Promise(async (resolve, reject) => {
      let couponDetails = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ _id: objectId(couponId) });
      resolve(couponDetails);
    });
  },

  // edit coupon
  editCoupon: (data, couponId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne(
          { _id: objectId(couponId) },
          {
            $set: {
              coupon: data.coupon,
              starting: data.starting,
              expiry: data.expiry,
              offer: data.offer,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  // delete coupon
  deleteCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: objectId(couponId) })
        .then(() => {
          resolve();
        });
    });
  },

  // validate coupon
  validateCoupon: (couponCode, userId, totalAmount) => {
    return new Promise(async (resolve, reject) => {
      obj = {}
      let date = new Date()
      date = moment(date).format('DD/MM/YYYY')
      let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: couponCode, available: true })
      if (coupon) {
        let users = coupon.users
        let userCheck = users.includes(userId)
        if (userCheck) {
          obj.couponUsed = true
          resolve(obj)
        } else {
          console.log("coupon valid");
          if (date <= coupon.expiry) {
            let total = parseInt(totalAmount)
            let percentage = parseInt(coupon.offer)
            let discountValue = ((total * percentage) / 100).toFixed()

            obj.total = total - discountValue
            obj.success = true
            obj.discountValue = discountValue
            resolve(obj)
          } else {
            console.log("coupon expired");
            obj.couponExpired = true
            resolve(obj)
          }
        }
      } else {
        console.log("coupon invalid");
        obj.invalidCoupon = true
        resolve(obj)
      }
    })
  }
}
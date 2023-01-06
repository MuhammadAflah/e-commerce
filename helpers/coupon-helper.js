
const db = require("../config/connection");
const collection = require("../config/collection");
const objectId = require("mongodb").ObjectId;
const moment = require("moment");

module.exports = {
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
  startCouponOffer: (date) => {
    let couponStartDate = new Date(date);
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({ startDateIso: { $lte: couponStartDate } })
        .toArray();
      if (coupons) {
        await coupons.map(async (coupon) => {
          await db
            .get()
            .collection(collection.COUPON_COLLECTION)
            .updateOne(
              { _id: objectId(coupon._id) },
              {
                $set: {
                  available: true,
                },
              }
            )
            .then(() => {
              resolve();
            });
        });
      } else {
        resolve();
      }
    });
  },
  addCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ coupon: data.coupon });
      if (exist) {
        reject();
      } else {
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
            offer: parseInt(data.offer),
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
      }
    });
  },
  getCouponDetails: (couponId) => {
    return new Promise(async (resolve, reject) => {
      let couponDetails = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ _id: objectId(couponId) });
      resolve(couponDetails);
    });
  },
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
  validateCoupon: (couponCode, userId, totalAmount) => {
    return new Promise(async (resolve, reject) => {
      obj = {};
      let date = new Date();
      // date = moment(date).format("DD/MM/YYYY");
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ coupon: couponCode, available: true });
      if (coupon) {
        let users = coupon.users;
        let userCheck = users.includes(userId);
        if (userCheck) {
          obj.couponUsed = true;
          resolve(obj);
        } else {
          if (date <= coupon.endDateIso) {
            let total = parseInt(totalAmount);
            let percentage = parseInt(coupon.offer);
            let discountValue = ((total * percentage) / 100).toFixed();

            obj.total = total - discountValue;
            obj.success = true;
            obj.discountValue = discountValue;
            resolve(obj);
          } else {
            obj.couponExpired = true;
            resolve(obj);
          }
        }
      } else {
        obj.invalidCoupon = true;
        resolve(obj);
      }
    });
  },
};

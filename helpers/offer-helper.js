var db = require('../config/connection')
var bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
var collection = require('../config/collection')
const { resolve, reject } = require('promise')
const moment = require('moment')
var objectId = require('mongodb').ObjectId

module.exports = {

  // get all product offer
  getAllProductOffers: () => {
    return new Promise(async (resolve, reject) => {
      let allProdOffers = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .find()
        .toArray();
      resolve(allProdOffers);
    });
  },

  // add product offer
  addProductOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db.get().collection(collection.PRODUCT_OFFERS).findOne({ product: data.product })
      if (exist) {
        reject()
      } else {
        data.startDateIso = new Date(data.starting);
        data.endDateIso = new Date(data.expiry);
        data.proOfferPercentage = parseInt(data.proOfferPercentage);
        let exist = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ name: data.name, offer: { $exists: true } });
        if (exist) {
          reject();
        } else {
          db.get()
            .collection(collection.PRODUCT_OFFERS)
            .insertOne(data)
            .then((response) => {
              resolve();
            });
        }
      }
    });
  },

  //get product offer details
  getProdOfferDetails: (proOfferId) => {
    return new Promise(async (resolve, reject) => {
      let proOfferDetails = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .findOne({ _id: objectId(proOfferId) });
      resolve(proOfferDetails);
    });
  },

  // edit product offer
  editProdOffer: (proOfferId, data) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_OFFERS).updateOne({ _id: objectId(proOfferId) }, {
        $set: {
          product: data.product,
          starting: data.starting,
          expiry: data.expiry,
          proOfferPercentage: parseInt(data.proOfferPercentage),
          startDateIso: new Date(data.starting),
          endDateIso: new Date(data.expiry)
        }
      }).then(() => {
        resolve()
      })
    });
  },

  // delete product offer
  deleteProdOffer: (proOfferId) => {
    return new Promise(async (resolve, reject) => {
      let productOffer = await db.get().collection(collection.PRODUCT_OFFERS).findOne({ _id: objectId(proOfferId) })
      let pname = productOffer.product
      let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ name: pname })
      db.get().collection(collection.PRODUCT_OFFERS).deleteOne({ _id: objectId(proOfferId) }).then(() => {
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ name: pname },
          {
            $set: {
              price: product.actualPrice
            },
            $unset: {
              offer: "",
              proOfferPercentage: "",
              actualPrice: "",

            }
          }).then(() => {
            resolve()
          })
      })
    })

  },

  //start product offer
  startProductOffer: (date) => {
    let proStartDateIso = new Date(date);

    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .find({ startDateIso: { $lte: proStartDateIso } })
        .toArray();
      if (data.length > 0) {
        console.log(data, "dataa");
        await data.map(async (onedata) => {
          console.log(onedata, "onedata");
          let product = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .findOne({ name: onedata.product, offer: { $exists: false } });
          if (product) {
            let actualPrice = product.price;
            let newPrice = (product.price * onedata.proOfferPercentage) / 100;
            newPrice = newPrice.toFixed();
            console.log(actualPrice, newPrice, onedata.proOfferPercentage);
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: ObjectId(product._id) },
                {
                  $set: {
                    actualPrice: actualPrice,
                    price: actualPrice - newPrice,
                    offer: true,
                    proOfferPercentage: onedata.proOfferPercentage,
                  },
                }
              );
            resolve();
            console.log("get");
          } else {
            resolve();
            console.log("rejected");
          }
        });
      }
      resolve()
    });
  },

  // category offers
  getAllCategories: () => {
    return new Promise(async (resolve, reject) => {
      let allCategories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
      resolve(allCategories)
    })
  },

  // get all category offer
  getAllCatOffers: () => {
    return new Promise(async (resolve, reject) => {
      let allCatOffers = await db.get().collection(collection.CATEGORY_OFFERS).find().toArray()
      resolve(allCatOffers)
    })
  },

  // category offer section
  addCatOffer: (data) => {
    let cname = data.category
    data.catOfferPercentage = parseInt(data.catOfferPercentage)
    return new Promise(async (resolve, reject) => {
      let exist = await db.get().collection(collection.CATEGORY_OFFERS).findOne({ category: data.category })
      if (exist) {
        reject()
      } else {
        data.startDateIso = new Date(data.starting)
        data.endDateIso = new Date(data.expiry)
        let response = {};
        let exist = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ name: data.product, offer: { $exists: true } });
        if (exist) {
          reject()
        } else {
          db.get().collection(collection.CATEGORY_OFFERS).insertOne(data).then(async (response) => {
            resolve(response)
          }).catch((err) => {
            reject(err)
          })
        }
      }


    })
  },

  // start category offer
  startCategoryOffer: (date) => {
    let startDateIso = new Date(date);
    return new Promise(async (resolve, reject) => {
      let data = await db.get().collection(collection.CATEGORY_OFFERS).find({ startDateIso: { $lte: startDateIso } }).toArray();
      if (data.length > 0) {
        await data.map(async (onedata) => {

          let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ offer: { $exists: false }, category: onedata.category }).toArray();

          await products.map(async (product) => {
            let actualPrice = product.price
            let newPrice = (((product.price) * (onedata.catOfferPercentage)) / 100)
            newPrice = newPrice.toFixed()
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
              {
                $set: {
                  actualPrice: actualPrice,
                  price: (actualPrice - newPrice),
                  offer: true,
                  catOfferPercentage: onedata.catOfferPercentage
                }
              })
          })
        })
        resolve();
      } else {
        resolve();
      }
    })
  },

  // get category offer details
  getCatOfferDetails: (catOfferId) => {
    return new Promise(async (resolve, reject) => {
      let catOfferDetails = await db.get().collection(collection.CATEGORY_OFFERS).findOne({ _id: objectId(catOfferId) })
      resolve(catOfferDetails)
    })
  },

  // edit category offer
  editCatOffer: (catOfferId, data) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_OFFERS).updateOne({ _id: objectId(catOfferId) }, {
        $set: {
          category: data.category,
          starting: data.starting,
          expiry: data.expiry,
          catOfferPercentage: parseInt(data.catOfferPercentage),
          startDateIso: new Date(data.starting),
          endDateIso: new Date(data.expiry)

        }
      }).then(() => {
        resolve()

      })

    })
  },

  // delete category offer
  deleteCatOffer: (catOfferId) => {
    return new Promise(async (resolve, reject) => {
      let catOffer = await db.get().collection(collection.CATEGORY_OFFERS).findOne({ _id: objectId(catOfferId) })
      let category = catOffer.category
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category, offer: { $exists: true } }).toArray()
      if (products) {
        await db.get().collection(collection.CATEGORY_OFFERS).deleteOne({ _id: objectId(catOfferId) }).then(async () => {
          await products.map(async (product) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) }, {
              $set: {
                price: product.actualPrice
              },
              $unset: {
                offer: "",
                catOfferPercentage: "",
                actualPrice: "",
              }
            }).then(() => {
              resolve()
            })

          })

        })
      } else {
        resolve()
      }
    })
  },
}
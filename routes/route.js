import express from "express";
import { isAuth } from "../middleware/isAuthenticated.js";
import isMulterApproved from "../middleware/isMulterApproved.js";

import authController from '../controller/auth.js';
import categoryController from '../controller/category.js';
import subCategoryController from '../controller/subCategory.js';
import productController from '../controller/product.js';
import variationController from '../controller/variation.js';

// import publicController  from '../controller/booking.js';

const router = express.Router();

// Auth Routes
router.route('/auth/login').post(authController.postLogin);
router.route('/auth/logout').get(isAuth, authController.getLogout);

// Category and SubCategory
router.route('/admin/category').post(isAuth, categoryController.postCategory).put(isAuth, categoryController.putCategory).get(isAuth, categoryController.getCategoryList);
router.route('/admin/category/:categoryID').get(isAuth, categoryController.getInitCategory).put(isAuth, categoryController.putCategoryStatus).delete(isAuth, categoryController.deleteCategory);

router.route('/admin/subCategory').post(isAuth, subCategoryController.postSubCategory).put(isAuth, subCategoryController.putSubCategory).get(isAuth, subCategoryController.getSubCategoryList);
router.route('/admin/subCategory/:categoryID').get(isAuth, subCategoryController.getInitSubCategory).put(isAuth, subCategoryController.putSubCategoryStatus).delete(isAuth, subCategoryController.deleteSubCategory);

// Product Routes
router.route('/admin/product/variation/:productID/:variationID').get(isAuth, variationController.getInitVariation).put(isAuth, variationController.putVariationStatus).delete(isAuth, variationController.deleteVariation);
router.route('/admin/product/variation').post(isAuth, isMulterApproved, variationController.postVariation).put(isAuth, isMulterApproved, variationController.putVariation);

router.route('/admin/product').post(isAuth, isMulterApproved, productController.postProduct).put(isAuth, isMulterApproved, productController.putProduct).get(isAuth, productController.getProductList);
router.route('/admin/product/:productID').get(isAuth, productController.getInitProduct).put(isAuth, productController.putProductStatus).delete(isAuth, productController.deleteProduct);

// Order Routes
router.route('/admin/order/:orderID?').get(isAuth, ).put(isAuth, )



// Public Routes
// router.route('/public/reservation').post(publicController.postReservation);
// router.route('/public/service_list').get(serviceController.getPublicServiceList);
// router.route('/public/service_booking').post(publicController.postServiceBooking);

// Till Here
// router.route('/api/doc/:userID').get(isAuth, memberController.getRemainingDocumentList)
// router.route('/auth/member').post(isAuth, memberController.postMember).put(isAuth, memberController.putMemberDetail).get(memberController.getMemberList);
// router.route('/auth/member/:memberID').get(isAuth, memberController.getInitMember).delete(isAuth, memberController.deleteMember);
// router.route('/auth/member/doc/:userID?/:docID?').post(isAuth, isMulterApproved, memberController.postDocument).delete(isAuth, memberController.deleteDocument)


// // Employee
// router.route('/employee/payment-acknowledgement').put(isAuth, attendanceController.putPaymentAcknowledgement)
// router.route('/employee/userDetails/:memberID').get(isAuth, memberController.getMemberDetail)


router.use('/', async (req, res) => {
    console.log(req.originalUrl);
    return res.send({ message: 'Undefined Request URL' })
})

export default router;
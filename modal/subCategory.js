import mongoose from 'mongoose';
import Product from './product.js';
import { handleImageDeleting } from '../helper/cloudinary.js';
import User from './user.js';
import Order from './order.js';

const SubCategorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: false,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
}, { timestamps: true });

SubCategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const products = await Product.find({ subCategoryId: this._id }).session(session);
    const productIds = products.map(product => product._id);
    const productImages = products.flatMap(product => product.images);

    // Delete images associated with products
    const imageDeletionPromises = productImages.map(async (image) => {
      try {
          const imageURL = image;
          const publicId = imageURL.split('/').pop().split('.')[0];
          await handleImageDeleting(publicId);
      } catch (error) {
          console.error('Error deleting image:', error);
          await session.abortTransaction();
          session.endSession();
      }
    });
    await Promise.all(imageDeletionPromises);

    // Delete products
    await Product.deleteMany({ _id: { $in: productIds } }).session(session);

    // Update User cart
    await User.updateMany(
      { 'cart.productId': { $in: productIds } },
      { $pull: { cart: { productId: { $in: productIds } } } },
      { session }
    );

    // Delete orders associated with products
    await Order.deleteMany({
      'products.productId': { $in: productIds }
    }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    next();
  } catch (error) {
    // Abort the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    console.error('Error in pre-delete middleware:', error);
    next(error); // Pass the error to the next middleware
  }
});

const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

export default SubCategory;
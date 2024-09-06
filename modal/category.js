import mongoose from 'mongoose';
import SubCategory from './subCategory.js';
import Product from './product.js';
import Order from './order.js';
import { handleImageDeleting } from '../helper/cloudinary.js';
import User from './user.js';


const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true,
    },
}, { timestamps: true });

CategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const subCategories = await SubCategory.find({ categoryId: this._id }).session(session);
      const subCategoryIds = subCategories.map(subCat => subCat._id);
  
      const products = await Product.find({ subCategoryId: { $in: subCategoryIds } }).session(session);
      const productIds = products.map(product => product._id);
      const productImages = products.flatMap(product => product.images);
  
      // Delete images associated with the products
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
      await Product.deleteMany({ _id: { $in: productIds } }).session(session);
  
      // Remove products from users' carts
      await User.updateMany(
        { 'cart.productId': { $in: productIds } },
        { $pull: { cart: { productId: { $in: productIds } } } },
        { session } // Bind session to the query
      );
  
      // Remove orders containing the products
      await Order.deleteMany({
        'products.productId': { $in: productIds }
      }).session(session);
  
      // Delete subcategories associated with the category
      await SubCategory.deleteMany({ categoryId: this._id }).session(session);
  
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
  
const Category = mongoose.model('Category', CategorySchema);

export default Category;
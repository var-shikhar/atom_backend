import mongoose from 'mongoose';
import { handleImageDeleting } from '../helper/cloudinary.js';
import User from './user.js';
import Order from './order.js';


const VariationSchema = new mongoose.Schema({
    value: { 
        type: String, 
        required: false 
    }, // Variation value (e.g., "Red", "Blue")
    images: [{ 
        type: String, 
        default: [] 
    }],   
    mrpPrice: { 
        type: Number, 
        required: false,
        default: 0,
    }, 
    sellingPrice: { 
        type: Number, 
        required: false,
        default: 0,
    },   
    stock: { 
        type: Number, 
        required: false, 
        default: 0 
    }, 
    sku: { 
        type: String, 
        required: false,
        unique: false,
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },     
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
    },  
    description: { 
        type: String,
        required: false,
        trim: true, 
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true,
    },
    baseMRPPrice: { 
        type: Number, 
        required: true,
        default: 0,
    },
    baseSellingPrice: { 
        type: Number, 
        required: true,
        default: 0,
    },
    baseStock: { 
        type: Number, 
        required: true,
        default: 0,
    },
    baseSku: { 
        type: String, 
        required: function() { return this.variations.length === 0 }
    },
    variations: { 
        type: [VariationSchema], 
        default: [] 
    },
    variationName: { 
        type: String,
        required: false,
        enum: ['SIZE', 'COLOR', 'NA'],
        default: 'NA',
    },
    images: [{ 
        type: String, 
        default: [] 
    }],
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    isVariationProduct: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });

ProductSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
        const product = await Product.findById(this._id).session(session); // Bind session to the query
        if (!product) {
            throw new Error('Product not found');
        }
  
        const imageDeletionPromises = product.images.map(async (image) => {
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
  
        // Handle variations related to the product
        if (product.variations?.length > 0) {
            const variationsImages = product.variations.flatMap(item => item.images);
        
            variationsImages.forEach(async image => {
                const imageURL = image;
                const publicId = imageURL.split('/').pop().split('.')[0];
                try {
                    await handleImageDeleting(publicId);
                } catch (error) {
                    console.error('Error deleting image:', error);
                    // Handle the error appropriately
                }
            });
        }
  
        await User.updateMany(
            { 'cart.productId': this._id },
            { $pull: { cart: { productId: this._id } } },
            { session } // Bind session to the query
        );
  
        // Remove orders containing this product
        await Order.deleteMany({
            'products.productId': this._id
        }).session(session);
  
        // Delete the product itself
        await Product.deleteOne({ _id: this._id }).session(session);
  
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
const Product = mongoose.model('Product', ProductSchema);

export default Product;


import mongoose from 'mongoose';
import Order from './order.js';

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Customer', 'Admin'],
        required: true,
        default: 'Customer'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    defaultShippingAddress: {
        addressLine1: { type: String, required: false },
        addressLine2: { type: String, required: false },
        city: {
            type: String, 
            required: false
        },
        stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: false },
        zipCode: { type: String, required: false },
        countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: false },
    },
    cart: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: false
        },
        quantity: {
            type: Number,
            required: false,
            default: 1
        }
    }],
    wishlist: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
    }],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);


UserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        await Order.deleteMany({ userId: this._id });
        next();
    } catch (error) {
      console.error('Error in pre-delete middleware:', error);
      next(error); // Pass the error to the next middleware
    }
});

export default User;

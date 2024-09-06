import mongoose from 'mongoose';
import Order from './order.js';
import User from './user.js';

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    countryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    }
});

stateSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const stateToDelete = this;
        
        // Check for "Undefined" state
        let undefinedState = await State.findOne({ name: 'Undefined' }).session(session);

        // If "Undefined" state doesn't exist, create it
        if (!undefinedState) {
            undefinedState = await State.create([{ name: 'Undefined', countryId: null }], { session });
        }

        // Update Orders to reference "Undefined" state
        await Order.updateMany(
            { 'shippingAddress.stateId': stateToDelete._id },
            { $set: { 'shippingAddress.stateId': undefinedState._id } },
            { session }
        );

        // Update Users to reference "Undefined" state
        await User.updateMany(
            { 'defaultShippingAddress.stateId': stateToDelete._id },
            { $set: { 'defaultShippingAddress.stateId': undefinedState._id } },
            { session }
        );

        // Delete the state
        await State.deleteOne({ _id: stateToDelete._id }).session(session);

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        next();
    } catch (error) {
        // Abort the transaction in case of error
        await session.abortTransaction();
        session.endSession();
        console.error('Error in pre-delete middleware for State:', error);
        next(error); // Pass the error to the next middleware
    }
});

const State = mongoose.model('State', stateSchema);
export default State;

import mongoose from 'mongoose';
import State from './state.js';
import Order from './order.js';
import User from './user.js';

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    }
});

countrySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const states = await State.find({ countryId: this._id }).session(session);
      const stateIds = states.map(state => state._id);
  
      // Optionally, create or find the "undefined" state
      let undefinedCountry = await Country.findOne({ name: 'Undefined' }).session(session);
      if (!undefinedCountry) {
        undefinedCountry = await Country.create([{
          name: 'Undefined',
          code: 'NA'
        }], { session });
      }
  
      // Update states to the "undefined" state
      await State.updateMany({ _id: { $in: stateIds } }, { countryId: undefinedCountry._id }, { session });
      
      await User.updateMany(
        { 'defaultShippingAddress.countryId': this._id },
        { $set: { 'defaultShippingAddress.countryId': undefinedCountry._id } },
        { session }
    );

  
      // Handle other documents that reference the country
      await Order.updateMany({ 'shippingAddress.countryId': this._id }, { $set: { 'shippingAddress.countryId': undefinedCountry._id } }, { session });
  
      // Delete the country
      await this.deleteOne({ session });
  
      await session.commitTransaction();
      session.endSession();
      next();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error in pre-delete middleware:', error);
      next(error); // Pass the error to the next middleware
    }
  });
  

const Country = mongoose.model('Country', countrySchema);
export default Country;

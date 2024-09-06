import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DEFAULT_DATA from '../constant/defaultData.js';
import Country from '../modal/country.js';
import State from '../modal/state.js';
import User from '../modal/user.js';

dotenv.config();
const { MONGO_URI, SALT } = process.env;
const {COUNTRY_LIST, STATE_LIST} = DEFAULT_DATA;
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const userCount = await User.countDocuments();
        const stateCount = await State.countDocuments();
        const countryCount = await Country.countDocuments();


        if (userCount === 0) {
            const hashedPassword = await bcrypt.hash('Admin@123', Number(SALT));
            let adminUser = new User({
                firstName: 'Admin',
                lastName: 'user',
                phone: 9876543210,
                email: 'admin@atomshop.in',
                password: hashedPassword,
                role: 'Admin',
                isAdmin: true,
            });

            await adminUser.save();
            console.log('Admin user created');
        }

        if (countryCount === 0){
            await Country.insertMany(COUNTRY_LIST)
        }

        if (stateCount === 0){
            const countryID = await Country.findOne({ name: 'India' });
            if (!countryID) {
                console.error('Country India not found.');
                return;
            }

            const modStateData = STATE_LIST.map(state => ({
                ...state,
                countryId: countryID._id
            }));
            
            await State.insertMany(modStateData);    
        }
        
        mongoose.connection.emit('connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;

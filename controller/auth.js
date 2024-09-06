import bcrypt from "bcrypt";
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import CONSTANT from '../constant/constant.js';
import User from "../modal/user.js";

dotenv.config();
const { RouteCode } = CONSTANT;
const { JWT_SECRET_KEY } = process.env;

const postLogin = async (req, res) => {
    const { userEmail, userPassword } = req.body;
    try {
        let validateUser = await User.findOne({ email: userEmail });
        if (!validateUser) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({message: 'Account not active. Contact Admin for Support!' });
        }

        // Check if password matches
        const isCorrectPassowrd = await bcrypt.compare(userPassword.toString(), validateUser.password);
        if (!isCorrectPassowrd) {
            return res.status(RouteCode.UNAUTHORIZED.statusCode).json({ message: 'Password is incorrect' });
        }

        // Generate JWT token
        const jwtToken = jwt.sign({ email: validateUser.email }, JWT_SECRET_KEY, { expiresIn: '1d' });
        // Setting a cookie with domain and path options
        res.cookie('tkn', jwtToken, { secure: true, httpOnly: true, sameSite: 'None'});

        // Returnable User Data
        const returnedData = {
            userID: validateUser._id,
            userEmail: validateUser.email,
            userName: validateUser.firstName + ' ' + validateUser.lastName,
            token: jwtToken,
            isAdmin: validateUser.isAdmin,
        };

        return res.status(RouteCode.SUCCESS.statusCode).json(returnedData);
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }

};
const getLogout = async (req, res) => {
    try {
        const token = req.cookies.tkn;
        if (!token) {
            return res.status(RouteCode.UNAUTHORIZED.statusCode).json({ message: RouteCode.UNAUTHORIZED.message });
        }

        // Clear the token cookie
        res.clearCookie('tkn', { secure: true, httpOnly: true });

        // Return success message
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Logged-Out Successfully!' });
    } catch (err) {
        console.error('Error during logout:', err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};

export default {
    postLogin, getLogout
}
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import CONSTANT from '../constant/constant.js';
import User from '../modal/user.js';

dotenv.config();

const { JWT_SECRET_KEY } = process.env;
const { RouteCode } = CONSTANT;

export const isAuth = async (req, res, next) => {
    try {
        const token = req?.cookies?.tkn ?  req.cookies.tkn : req.header('x-auth-token');

        if (!token) {
            return res.status(RouteCode.UNAUTHORIZED.statusCode).json({ message: "You're not authenticated, Login First!" });
        }

        jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                console.error(err);
                return res.status(RouteCode.FORBIDDEN.statusCode).json({ message: "Login Again!" });
            }

            // Check if the user is active
            let userData = await User.findOne({ email: decoded.email });
            if (!userData) {
                return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
            }
            req.user = userData._id;
            next();
        });

    } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};

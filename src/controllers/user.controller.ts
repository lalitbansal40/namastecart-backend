import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginValidationSchema, userValidationSchema } from "../validation/user.validation";
import { CONSTANTS } from "../config/constant";
import UserModel from "../models/user.model";
import { generateOtp, saveOtp, verifyOtp } from "../services/otp.services";
import { generateOtpTemplate } from "../utils/templates";
import { sendMail } from "../utils/helpers";
import axios from "axios";


export const registerUser = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const { error, value } = userValidationSchema.validate(req.body);
        if (error) {
            res
                .status(CONSTANTS.STATUS_CODES.BAD_REQUEST)
                .json({ error: error.details[0].message });
            return
        }
        if (!value.isVerified) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.USER_NOT_VERIFIED,
            });
            return
        }
        // Check if user exists
        const existingUser = await UserModel.findOne({
            $or: [{ email: value.email }, { phone: value.phone }],
        });
        if (existingUser) {
            res
                .status(CONSTANTS.STATUS_CODES.CONFLICT)
                .json({ error: CONSTANTS.ERROR_MESSAGES.USER_EXISTS });
            return
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(value.password, 10);

        // Create user with role "user"
        const newUser = new UserModel({
            ...value,
            password: hashedPassword,
            role: "user",
        });

        // Save user
        const savedUser = await newUser.save();

        // Generate token
        const token = jwt.sign(
            {
                _id: savedUser._id,
                name: savedUser.first_name + " " + savedUser.last_name,
                email: savedUser.email,
                role: savedUser.role,
            },
            CONSTANTS.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Success response
        res.status(CONSTANTS.STATUS_CODES.CREATED).json({
            message: CONSTANTS.SUCCESS_MESSAGES.USER_REGISTERED,
            token,
            user: {
                _id: savedUser._id,
                name: savedUser.first_name + " " + savedUser.last_name,
                email: savedUser.email,
                phone: savedUser.phone,
                role: savedUser.role,
            },
        });
        return
    } catch (err) {
        console.error("Error in registerUser:", err);
        res
            .status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({ error: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER });
        return
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { error, value } = loginValidationSchema.validate(req.body);
        if (error) {
            res
                .status(CONSTANTS.STATUS_CODES.BAD_REQUEST)
                .json({ error: error.details[0].message });
            return
        }

        // Find user by email
        const email = value.email;
        const password = value.password;
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(CONSTANTS.STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS,
            });
            return
        }

        // Compare password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(CONSTANTS.STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS,
            });
            return
        }

        // Optional: Check if user is verified (depends on your schema)
        if (!user.isVerified) {
            res.status(CONSTANTS.STATUS_CODES.FORBIDDEN).json({
                success: false,
                message: 'User email is not verified',
            });
            return
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                _id: user._id,
                name: user.first_name + ' ' + user.last_name,
                email: user.email,
                role: user.role,
            },
            CONSTANTS.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send success response with token and user info
        res.status(CONSTANTS.STATUS_CODES.OK).json({
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.USER_LOGGED_IN,
            token,
            user: {
                _id: user._id,
                name: user.first_name + ' ' + user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
        return
    } catch (error) {
        console.error('Login error:', error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER,
        });
        return
    }
};

export const sendOtpEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Email is required" });
        return;
    }

    const otp = generateOtp();
    const htmlContent = generateOtpTemplate(otp);

    const mailSent = await sendMail(email, "NamasteCart OTP Verification", htmlContent);
    if (!mailSent) {
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to send OTP" });
        return
    }

    saveOtp(email, otp, CONSTANTS.OTP_EXPIRY_MS);
    res.status(CONSTANTS.STATUS_CODES.OK).json({ success: true, message: CONSTANTS.MESSAGES.OTP_SENT });
    return
};

export const verifyOtpEmail = (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Email and OTP are required" });
        return
    }

    const valid = verifyOtp(email, otp);
    if (!valid) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: CONSTANTS.MESSAGES.OTP_INVALID });
        return
    }

    res.status(CONSTANTS.STATUS_CODES.OK).json({ success: true, message: CONSTANTS.MESSAGES.OTP_VERIFIED });
    return
};

export const googleAuthController = async (req: Request, res: Response) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.TOKEN_ID_REQUIRED,
            });
            return
        }

        // Get full user info from Google
        const googleResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const { email, email_verified, name, picture } = googleResponse.data;

        if (!email_verified) {
            res.status(CONSTANTS.STATUS_CODES.FORBIDDEN).json({
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.EMAIL_NOT_VERIFIED_WITH_GOOGLE,
            });
            return
        }

        // Split name into first and last
        const [first_name, ...rest] = name?.split(" ") || ["User"];
        const last_name = rest.join(" ");

        const user = await UserModel.findOne({ email });

        // If user exists, log them in
        if (user) {
            const token = jwt.sign(
                {
                    _id: user._id,
                    name: user.first_name + " " + user.last_name,
                    email: user.email,
                    role: user.role,
                },
                CONSTANTS.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.status(CONSTANTS.STATUS_CODES.OK).json({
                success: true,
                message: CONSTANTS.SUCCESS_MESSAGES.USER_LOGGED_IN,
                token,
                user: {
                    _id: user._id,
                    name: user.first_name + " " + user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                },
            });
            return
        }

        // Register user if not found
        const password = email + CONSTANTS.JWT_SECRET;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            isVerified: true,
            role: "user",
            avatar: picture, // optional: store profile picture
        });

        const savedUser = await newUser.save();

        const newToken = jwt.sign(
            {
                _id: savedUser._id,
                name: savedUser.first_name + " " + savedUser.last_name,
                email: savedUser.email,
                role: savedUser.role,
            },
            CONSTANTS.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(CONSTANTS.STATUS_CODES.CREATED).json({
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.USER_REGISTERED_VIA_GOOGLE,
            token: newToken,
            user: {
                _id: savedUser._id,
                name: savedUser.first_name + " " + savedUser.last_name,
                email: savedUser.email,
                role: savedUser.role,
                avatar: picture,
            },
        });
        return
    } catch (error) {
        console.error("Google auth error:", error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER,
        });
        return
    }
};

export const sendForgotPasswordOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.EMAIL_REQUIRED })
        return
    };

    const user = await UserModel.findOne({ email });
    if (!user) {
        res.status(CONSTANTS.STATUS_CODES.NOT_FOUND).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.USER_NOT_FOUND });
        return
    }

    const otp = generateOtp();
    saveOtp(email, otp);

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Password Reset Request</h2>
      <p>Dear User,</p>
      <p>We received a request to reset your account password associated with this email address.</p>
      <p><strong>Your One-Time Password (OTP) is:</strong></p>
      <h1 style="letter-spacing: 2px;">${otp}</h1>
      <p>This OTP is valid for <strong>60 seconds</strong>. Please do not share it with anyone.</p>
      <p>If you did not request this, you can safely ignore this email. Your account will remain secure.</p>
      <br/>
      <p>Thank you,</p>
      <p><strong>NamasteCart Support Team</strong></p>
    </div>
  `;


    try {
        await sendMail(email, 'Password Reset OTP', html);

        res.status(CONSTANTS.STATUS_CODES.OK).json({ success: true, message: CONSTANTS.MESSAGES.OTP_SENT });
        return
    } catch (error) {
        console.error(error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to send OTP' });
    }
};

export const verifyForgotOtp = (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Email and OTP required' });
        return
    }

    const isValid = verifyOtp(email, otp);
    if (!isValid) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: CONSTANTS.MESSAGES.OTP_INVALID })
        return
    };

    res.status(CONSTANTS.STATUS_CODES.OK).json({ success: true, message: CONSTANTS.MESSAGES.OTP_VERIFIED });
    return
};

export const resetForgotPassword = async (req: Request, res: Response) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Email and new password required' });
        return
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await UserModel.findOneAndUpdate({ email }, { password: hashedPassword });
    if (!user) {
        res.status(CONSTANTS.STATUS_CODES.NOT_FOUND).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.USER_NOT_FOUND });
        return
    }

    res.status(CONSTANTS.STATUS_CODES.OK).json({ success: true, message: 'Password updated successfully' });
    return
};
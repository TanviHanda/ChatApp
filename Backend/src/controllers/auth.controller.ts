import User from "@/models/user.model.js";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/utils.js";
import cloudinary from "@/lib/cloudinary.js";

// Extend Express Request to include user (if middleware sets it)
declare global {
  namespace Express {
    interface Request {
      user?: any; // you can replace `any` with IUser later
    }
  }
}

interface SignupRequest extends Request {
  body: {
    fullName: string;
    email: string;
    password: string;
  };
}

export const signup = async (req: SignupRequest, res: Response) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // jwt token here
      generateToken(newUser._id.toString(), res);
      await newUser.save();
     return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
    return  res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token and set cookie
    generateToken(user._id.toString(), res);

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (_req: Request, res: Response) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
   return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { profilePic } = req.body as { profilePic: string };
    const userId = req.user?._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Please provide a profile picture" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = async (req: Request, res: Response) => {
  try {
   return res.status(200).json(req.user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

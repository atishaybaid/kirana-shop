import { Request, Response, NextFunction } from "express";
import Business from "./Business.Model";
import responseCode, { responseMessage } from "./utils/resonseCode";
import { generateToken, verifyToken } from "./Jwt";

export const testController = (req: Request, res: Response) => {
  res.send("test controller called");
};

/*
flow with otp

1. user enters phone number and business name
2. we send a otp to the phone number
3. user enters the otp
4. we verify the otp
5. if otp is verified, we create a business user  

tech flow

1. otp is stored inside redis with phone number as key and otp as value
2. if otp is successfully verified, we create a business user with phone number and business nam

user journey

1. user enters phone number and business name
2. we will check in db if user already exists with phone number
3. if user exists ,we will send the message that user already exists,login instead
4. if user does not exist, we will send the otp to the phone number,and store the otp in redis with phone number as key and otp as value

apiflow

1. signup api will get new phone number and business name
2. singup will check if user already exists with phone number,if yes it will return user already exists,else send otp to the phone number and store the otp in redis with phone number as key and otp as value
3. signup/verifyOtp api will get phone number,business name and otp  it will internally call create business
4. the other steps will call update business api

5


apis
1. signup/create-if-new
2. signup/verifyOtp-and-create-business
3.


*/
const dummy_otp = "1234";
export const signupNew = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { businessName, phoneNumber } = req.body;
  try {
    console.log({
      businessName,
      phoneNumber,
      flow: "signupCreateIfNew",
    });
    const businessExists = await Business.findOne({
      phone: phoneNumber,
    });
    if (businessExists) {
      return res.status(400).json({
        message: "Business already exists",
        code: responseCode.BUSINESS_ALREADY_EXISTS,
      });
    }

    return res.status(200).json({
      message: "OTP sent successfully",
      code: responseCode.SUCCESS,
    });
  } catch (error) {
    next();
  }
};

export const verifyOtpAndCreateBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { businessName, phoneNumber, otp } = req.body;
  try {
    console.log({
      businessName,
      phoneNumber,
      otp,
      flow: "verifyOtpAndCreateBusiness",
    });
    if (otp !== dummy_otp) {
      return res.status(400).json({
        message: responseMessage.INVALID_OTP,
        code: responseCode.INVALID_OTP,
      });
    }
    const businessExists = await Business.findOne({
      phone: phoneNumber,
    });
    if (businessExists) {
      return res.status(400).json({
        message: "Business already exists",
        code: responseCode.BUSINESS_ALREADY_EXISTS,
      });
    }
    if (!businessExists) {
      const business = await Business.create({
        name: businessName,
        phone: phoneNumber,
      });
      const token = generateToken(business._id.toString());

      return res.status(200).json({
        id: business._id,
        name: business.name,
        code: responseCode.SUCCESS,
        token: token,
        message: responseMessage.BUSINESS_CREATED_SUCCESSFULLY,
      });
    }
  } catch (error) {
    console.log({
      error,
      flow: "verifyOtpAndCreateBusiness",
    });
    next();
  }
};

// interface SignupBody {
//   user_name: string;
//   user_email: string;
//   user_pass: string;
//   type?: string;
//   location: string;
// }

// export const signup = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   const {
//     user_name,
//     user_email,
//     user_pass,
//     type = "business-user",
//     location,
//   }: SignupBody = req.body;

//   try {
//     const businessExists = await Business.findOne({ email: user_email });

//     if (businessExists) {
//       return res.status(400).json({ message: "Business already exists" });
//     }

//     // const business = await Business.create({
//     //   name: user_name,
//     //   email: user_email,
//     //   password: user_pass,
//     //   type: type,
//     //   location: location,
//     // });

//     if (business) {
//       res.status(201).json({
//         _id: business._id,
//         name: business.name,
//         email: business.email,
//         // token: generateToken(user._id),
//         type: type,
//         success: true,
//       });
//     } else {
//       res.status(400).json({ message: "Invalid user data" });
//     }

//     next();
//   } catch (error) {
//     next();
//     res.status(500).json({
//       message: `Something went wrong ${error}`,
//     });
//   }
// };

interface UpdateBusinessData {
  name?: string;
  email?: string;
  type?: string;
  location?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

interface UpdateBusinessBody {
  businessId: string;
  businessData: UpdateBusinessData;
}

const validateBusinessData = (businessData: UpdateBusinessData) => {
  const businessKeys = Object.keys(businessData);
  const allowedKeys = ["name", "email", "type", "location", "address"];
  const isValid = businessKeys.every((key) => allowedKeys.includes(key));
  return isValid;
};

export const updateBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { businessId, businessData }: UpdateBusinessBody = req.body;

  try {
    const isValid = validateBusinessData(businessData);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid business data" });
    }
    const business = await Business.findByIdAndUpdate(businessId, businessData);
    return res.status(200).json({
      message: "Business updated successfully",
      code: responseCode.SUCCESS,
    });
  } catch (error) {
    next();
  }
};

export const getAllBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const businessList = await Business.find({});
    console.log("product list data");
    console.log(businessList);
    res.status(200).json({ businessList: businessList });
  } catch (error) {
    next();
    res.status(500).json({
      message: `Something went wrong  ${error}`,
    });
  }
};

/*
typescript flow
- Why is type script not trowing error for not knowing if req,will containe body or not?
- also why is type script not throwing error for not knowing if user_name is existing in body or not.

Self explination

- it would thoruw a error in general,when the parameters are passed by us,
- however it didnt throw a error because body is provided via liberary and typescript doest know it

*/

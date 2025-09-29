const StudentModel = require('../models/student.js');
// const ApiError = require('../utils/Apierror');
 const jwt=require('jsonwebtoken');
const asyncHandler=require('../utils/asyncHandler.js');
// const ParentModel = require("../models/parentmodel.js");

const TeacherModel = require('../models/teacher.js');
const ParentModel = require('../models/parent.js');

const verfiyJWT= asyncHandler(async(req,_,next)=>{
   try {
    const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

     if(!token){
         throw new Error("Unauthorized Access")
     }
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    let usermodel;
    switch(decodedToken.role){
      case "student":
        usermodel=StudentModel;
        break;
        case "parent":
          usermodel=ParentModel;
          break;
          case "teacher":
          usermodel=TeacherModel;
         break;
         default:
         throw new Error("Invalid Access Token")
    }
    const userFound=await usermodel.findById(decodedToken?._id).select(
     "-password -refreshtoken"
    )
    if(!userFound){
     throw new Error("Invalid Access Token")
    }
    req.userFound=userFound;
    next();
   } catch (error) {
     throw new Error(error?.message || " Invalid access Token")
   }
})
module.exports=verfiyJWT;
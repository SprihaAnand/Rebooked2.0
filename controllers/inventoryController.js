const inventoryModel = require("../models/inventoryModel")
const userModel = require('../models/userModel')
const mongoose = require("mongoose")
const createInventoryController = async (req, res) => {
    try {
      const { email } = req.body;
      //validation
      const user = await userModel.findOne({ email });
    //   if (!user) {
    //     throw new Error("User Not Found");
    //   }
      // if (inventoryType === "in" && user.role !== "donar") {
      //   throw new Error("Not a donar account");
      // }
      // if (inventoryType === "out" && user.role !== "hospital") {
      //   throw new Error("Not a hospital");
      // }
  
      if (req.body.inventoryType == "out") {
        const requestedBookGroup = req.body.bookGroup;
        const requestedQuantityOfBook = req.body.quantity;
        const organisation = new mongoose.Types.ObjectId(req.body.userId);
        //calculate Book Quanitity
        const totalInOfRequestedBook = await inventoryModel.aggregate([
          {
            $match: {
              organisation,
              inventoryType: "in",
              bookGroup: requestedBookGroup,
            },
          },
          {
            $group: {
              _id: "$bookGroup",
              total: { $sum: "$quantity" },
            },
          },
        ]);
        // console.log("Total In", totalInOfRequestedBlood);
        const totalIn = totalInOfRequestedBook[0]?.total || 0;
        //calculate OUT Blood Quanitity
  
        const totalOutOfRequestedBookGroup = await inventoryModel.aggregate([
          {
            $match: {
              organisation,
              inventoryType: "out",
              bloodGroup: requestedBookGroup,
            },
          },
          {
            $group: {
              _id: "$bloodGroup",
              total: { $sum: "$quantity" },
            },
          },
        ]);
        const totalOut = totalOutOfRequestedBookGroup[0]?.total || 0;
  
        //in & Out Calc
        const availableQuanityOfBookGroup = totalIn - totalOut;
        //quantity validation
        if (availableQuanityOfBookGroup < requestedQuantityOfBook) {
          return res.status(500).send({
            success: false,
            message: `Only ${availableQuanityOfBookGroup} books of ${requestedBookGroup.toUpperCase()} are available`,
          });
        }
        req.body.institute = user?._id;
      } else {
        req.body.donar = user?._id;
      }
  
      //save record
      const inventory = new inventoryModel(req.body);
      await inventory.save();
      return res.status(201).send({
        success: true,
        message: "New Book Reocrd Added",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Errro In Create Inventory API",
        error,
      });
    }
  };

const getInventoryController=async(req, res)=>{
    try {
        const inventory = await inventoryModel.find({
            organisation: req.body.userId,
        })
        .populate('donar')
        .populate('institute')
        .sort({createdAt: -1})
        return res.status(200).send({
            success: true,
            message: "get all records successfully",
            inventory
        })
        
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: 'Error In Get All Inventory API',
            error
        })
    }
}

module.exports = {createInventoryController, getInventoryController}
const inventoryModel = require("../models/inventoryModel")
const userModel = require('../models/userModel')

const createInventoryController = async(req, res)=>{
    try {
        const { email , inventoryType} = req.body;
        //validation
        const user = await userModel.findOne({ email });
        if (!user) {
          throw new Error("User Not Found");
        }

        if(inventoryType === "in" && user.role !== "donar")
        {
            throw new Error("Not a donar account")
        }
        
        if(inventoryType === 'out' && user.role != 'institute')
        {
            throw new Error('Not an Institution')
        }
        
        //save record
        const inventory = new inventoryModel(req.body)
        await inventory.save()
        return res.status(201).send({
            success: true,
            message: 'New Book Record Added'
        })

        
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: 'Error in Create Inventory API',
            error
        })
    }
}

module.exports = {createInventoryController}
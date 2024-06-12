const express = require('express')
const authMiddelware = require('../middleware/authMiddleware')
const { createInventoryController, getInventoryController, getDonarsController } = require('../controllers/inventoryController')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router()

//routes
// ADD INVENTORY || POST
router.post('/create-inventory', authMiddelware, createInventoryController)

//get all book records || GET
router.get('/get-inventory', authMiddelware, getInventoryController)

//get donar record
router.get('/get-donars', authMiddleware, getDonarsController)
module.exports = router
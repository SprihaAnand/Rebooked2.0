const express = require('express')
const authMiddelware = require('../middleware/authMiddleware')
const { createInventoryController, getInventoryController, getDonarsController, getInstituteController, getOrgnaisationController, getOrgnaisationForInstituteController, getInventoryInstituteController, getRecentInventoryController } = require('../controllers/inventoryController')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router()

//routes
// ADD INVENTORY || POST
router.post('/create-inventory', authMiddelware, createInventoryController)

//get all book records || GET
router.get('/get-inventory', authMiddelware, getInventoryController)

//get recent records
router.get('/get-recent-inventory', authMiddelware, getRecentInventoryController)

//get institute book records || GET
router.post('/get-inventory-institute', authMiddelware, getInventoryInstituteController)

//get donar record
router.get('/get-donars', authMiddleware, getDonarsController)

//get institute record
router.get('/get-institutes', authMiddleware, getInstituteController)

//get organisation record
router.get('/get-orgnaisation', authMiddleware, getOrgnaisationController)

//get organisation record for institute
router.get('/get-orgnaisation-for-institute', authMiddleware, getOrgnaisationForInstituteController)

module.exports = router
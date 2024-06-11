const express = require('express')
const authMiddelware = require('../middleware/authMiddleware')
const { createInventoryController, getInventoryController } = require('../controllers/inventoryController')
const router = express.Router()

//routes
// ADD INVENTORY || POST
router.post('/create-inventory', authMiddelware, createInventoryController)

//get all book records || GET
router.get('/get-inventory', authMiddelware, getInventoryController)

module.exports = router
const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema({
    inventoryType:{
        type: String,
        required: [true, 'inventory type require'],
        enum: ['in', 'out']
    },
    bookGroup:{
        type: String,
        required: [true, 'Book genre is required!'],
        enum:['Elementry', 'JEE', 'NEET', 'Novels', 'Architecture', 'History', 'Kids', 'Autobiographies']
    },
    quantity:{
        type: Number,
        required: [true, 'Book quantity required']
    },
    organisation:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'organisation name required']
    },
    institute:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required:function(){
            return this.inventoryType === "out"
        }
    },
    donar:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: function(){
            return this.inventoryType === 'in'
        }
    }

},{timestamps: true})

module.exports = mongoose.model('Inventory', inventorySchema)
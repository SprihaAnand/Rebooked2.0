const express = require('express')
const dotenv = require('dotenv')
const colors = require('colors')
const morgan = require('morgan')
const cors = require('cors')
const { connect } = require('mongoose')
const connectDB = require('./config/db')

//dot config
dotenv.config()

//mongodb connection
connectDB(); 

//rest object
//storing all functionality of express objects in a var
const app = express()

//middleware
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

//routes
// test route
app.use("/api/v1/test", require("./routes/testRoutes"));
// http://localhost:8080/test
app.use("/api/v1/auth", require("./routes/authRoutes"))

app.use("/api/v1/inventory", require("./routes/inventoryRoutes"))

const PORT = process.env.PORT || 8080;

//listen 
app.listen(PORT, ()=>{
    console.log(`Node server running in Mode : ${process.env.DEV_MODE} at PORT ${process.env.PORT}`.bgCyan.white)
})
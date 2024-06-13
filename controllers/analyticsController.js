const inventoryModel = require("../models/inventoryModel");
const mongoose = require("mongoose");
//GET Book DATA
const bookGroupDetailsContoller = async (req, res) => {
  try {
    const bookGroups = ['Elementry', 'JEE', 'NEET', 'Novels', 'Architecture', 'History', 'Kids', 'Autobiographies'];
    const bookGroupData = [];
    const organisation = new mongoose.Types.ObjectId(req.body.userId);
    //get single book group
    await Promise.all(
      bookGroups.map(async (bloodGroup) => {
        //COunt TOTAL IN
        const totalIn = await inventoryModel.aggregate([
          {
            $match: {
              bookGroup: bloodGroup,
              inventoryType: "in",
              organisation,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$quantity" },
            },
          },
        ]);
        //COunt TOTAL OUT
        const totalOut = await inventoryModel.aggregate([
          {
            $match: {
              bookGroup: bloodGroup,
              inventoryType: "out",
              organisation,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$quantity" },
            },
          },
        ]);
        //CALCULATE TOTAL
        const availabeBook =
          (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

        //PUSH DATA
        bookGroupData.push({
          bloodGroup,
          totalIn: totalIn[0]?.total || 0,
          totalOut: totalOut[0]?.total || 0,
          availabeBook,
        });
      })
    );

    return res.status(200).send({
      success: true,
      message: "Book Group Data Fetch Successfully",
      bookGroupData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Bookgroup Data Analytics API",
      error,
    });
  }
};

module.exports = { bookGroupDetailsContoller };
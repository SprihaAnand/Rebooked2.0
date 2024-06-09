const testController = (req, res) =>{
    res.status(200).send({
        message: 'test route with nodemon auto',
        success: true
    })
}
module.exports = {testController}
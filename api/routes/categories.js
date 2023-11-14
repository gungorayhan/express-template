var express = require('express');
var router = express.Router();

router.all('*', (req, res, next) => {
    if (true) {
        next();
    }
    else {
        res.json({
            success: false
        })
    }
})

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;

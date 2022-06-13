const router = require('express').Router();
const {auth} = require('../controller');

//product

//category

//authentication
router.post('/register', auth.register);
router.post('/login', auth.login);
// router.get('/token', auth.refreshToken);
// router.delete('/logout', auth.logout);

module.exports = router;
const isLogin = async(req, res, next) => {
    try{
        if(req.session.userid){
            next();
        }
        else {
            res.redirect('/login');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isLogout = async(req, res, next) => {
    try{
        
        if(!req.session.userid){
            next();
        }else{
            res.redirect('/');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isAuthenticated = async (req, res, next) => {
    try {
        if (req.session && req.session.userid) {
            res.locals.userAuthenticated = true;
            return next();
        } else {
            res.locals.userAuthenticated = false;
            return next();
        }
    } catch (error) {
        console.log(error);
    }
};




module.exports = {
    isLogin,
    isLogout,
    isAuthenticated,
}
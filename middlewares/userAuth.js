const isLogin = async(req, res, next) => {
    try{

        if(req.session.user_id){
            
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

        // if(!req.session.user_id){
        //     next();
        // }else{

        //     res.redirect('/home');
        // }
        if(req.session.userid){
            return res.redirect('/home');
             
        }
        next();

    } catch(error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}
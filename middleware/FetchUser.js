
var jwt = require('jsonwebtoken');

const FetchUser = (req, res, next)=>{
    const JWT_SECRET = process.env.JTW_TOKEN;
    const token = req.header('auth-token');
    if (!token){
        return res.status(401).send({error: "Please enter a valid token"});
    }
    try{
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    }catch{
        return res.status(401).send({error: "Please enter a valid token"});
    }
}
module.exports  = FetchUser;
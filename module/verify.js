const jwt = require("jsonwebtoken")
const Configure = require('@sub0709/json-config');
const conf = Configure.load('config.json');


const verifyWithToken = async(req,res,next) =>{ // 토큰이 있는지 없는지만 확인
    try{
        const calledApi = `${req.method} ${req.originalUrl}`
        console.log(removeQueryString(calledApi))
        const nonVerifyApiList = conf.withoutTokenApi
        if(nonVerifyApiList.includes(removeQueryString(calledApi))){
            next() // 토큰인증이 필요없는 api
        } else{
            if(req.query.token){
                req.customData = tokenToData(req.query.token)
            } else if(req.body.token){
                req.customData = tokenToData(req.body.token)
            }
            console.log(req.customData)
            next()
            // if(req.customData == null){//만료된 토큰 혹은 유효하지 않은 토큰이라면,
            //     console.log("토큰만료")
            // }else{
            //     console.log("토큰인증성공")
            //     next()
            // }
        }
    }catch(err){
        console.log(`verifyToken Error : ${err.message}`)
    }
}

const removeQueryString= (str) => {
    const questionMarkIndex = str.indexOf('?');
    if (questionMarkIndex !== -1) {
      return str.substring(0, questionMarkIndex);
    } else {
      return str;
    }
}

const tokenToData = async(token)=>{
    try{
        jwt.verify(token,process.env.randomNum)
        const payload = token.split(".")[1]
        const data = Buffer.from(payload,"base64")
        return JSON.parse(data)
    }catch (err){
        console.log("토큰만료")
    }
        
}

const publishToken = async(req,res,next) =>{ //갱신과, 생성을 동시에 하나의 코드로
    try{
        if(req.customData){ //새로운 데이터가 있으면(로그인) 새 토큰 생성
            const token = jwt.sign({
                "usernum": req.customData.userNum //payload
                ,"userid": req.customData.userId
                ,"isadmin": req.customData.isAdmin
            },
            process.env.randomNum,
            {
                "issuer" : "hyoseok",
                "expiresIn" : "1m"
            })
            req.resData.token = token
            next()
        } else if (req.token){ //새로운 데이터가 없고, 기존 토큰이 존재하는 경우
            const token = req.token
            jwt.verify(token,process.env.randomNum)
            const payload = token.split(".")[1]
            const data = Buffer.from(payload,"base64")

            const newToken = jwt.sign(JSON.parse(data),
            process.env.randomNum,
            {
                "issuer" : "hyoseok",
                "expiresIn" : "1m"
            })
            req.resData.token = newToken
            next()
        }
    }catch(err){
        console.log(`publishToken Error : ${err.message}`)
    }
}

module.exports = {verifyWithToken,publishToken}
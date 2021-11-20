import express, {Response, Request, NextFunction} from "express";
import {getDB} from "./mongo";
import { Db } from "mongodb";
import {freeseats, login, logout, signin,book, free, mybookings} from "./resolvers";


const run = async () => {

    const app = express()
    const db:Db = await getDB()



    app.use(express.urlencoded({extended: true}));
    app.use(express.json())

   
    app.set("db", db);

    app.use((req:Request, res:Response, next:NextFunction) => {
        next();
    });

    app.get("/", (req:Request, res:Response) =>{
        res.status(200).json("Funcionando")
    })
    app.get("/status", (req:Request, res:Response) => {
        const today = new Date().toLocaleDateString()
        res.status(200).json(`${today}`)
        console.log(today.toString())
        console.log("Server working ")
    });




   
    app.post("/signin", signin)
    app.post("/login", login)

    var midd = {
        log: "/logout",
        freeS: "/freeseates",
        book: "/book",
        free: "/free",
        mybook: "/mybookings"
    }

    app.use([midd.log,midd.freeS,midd.book,midd.free, midd.mybook],async (req:Request, res:Response, next:NextFunction) => {
        if(!req.headers.token){
            return res.status(500).json("No has iniciado sesion")
        }
        
        console.log(req.headers.token || "No token");
        
        const db: Db = req.app.get("db")
        const user = await db.collection("practica3usuarios").findOne({token: req.headers.token})
        console.log(user)
        if(user){
            console.log("next")
            next();
        }else{
            console.info("not found")
            return res.status(500).json("not valid token")
        }
    })

    app.post("/logout",logout)
    app.get("/freeseats", freeseats)
    app.post("/book",book)
    app.post("/free", free)
    app.get("/mybookings", mybookings)
   
    app.listen(4000);
    console.log("app listening on port 4000")
}

try {
    run()
} catch (error) {
    throw(error);
}
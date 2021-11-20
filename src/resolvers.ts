import {Request, Response} from "express";
import {Db} from "mongodb"
import {uuid} from "uuidv4";

export const signin = async (req:Request, res:Response) => {
    
    const db: Db = req.app.get("db")
    const body = req.body
    
    const encontrado = await db.collection("practica3usuarios").findOne({email: body.email})
    if(!encontrado) {
        await db.collection("practica3usuarios").insertOne({
            email: body.email,
            password: body.password
        })
        
        return res.status(200).json({
            email: body.email,
            password: body.password
        })
    
    }else{
        return res.status(409).json({
           Body: "Ya existe alguien con ese email"
        })
    }  
}


export const login = async (req:Request, res:Response) => {
    const db: Db = req.app.get("db")
    const body = req.body
    const token = uuid()
    const encontrado = await db.collection("practica3usuarios").findOne({email: body.email})
    if(encontrado){
        await db.collection("practica3usuarios").updateOne({email: body.email},{$set: {token: token}!})
        return res.status(200).json(`${token}`)
    }else{
        return res.status(401).json("Error")
    }
}

export const logout = async (req:Request, res:Response) => {
    const db: Db = req.app.get("db")
    const body = req.body
    if(!req.body){
        return res.status(500).json("Error, no hay body")
    }
    const updated = await db.collection("practica3usuarios").updateOne({
        email:body.email,
        password:body.password,
        token: req.headers.token},
        {$set: {token: null}})
    if(updated){
        return res.status(200).json("Elimado")
    }else{
        return res.status(500).json("Error")
    }
}



export const freeseats = async (req:Request, res:Response) => {
    const day = parseInt(req.query.day as string)
    const month = parseInt(req.query.month as string)
    const year = parseInt(req.query.year as string)
    
    const valid = checkDateValidity(req.query.day as string,req.query.month as string,req.query.month as string)
    if(!valid){
        return res.status(500).json("Error de fecha")
    }
    const db:Db = req.app.get("db")
    
    const fechaDeterminada = await db.collection("practica3")
        .findOne({
                day:day,
                month:month,
                year:year
        })
   
    if(fechaDeterminada) {
        const asientos:{numero:number, token:undefined}[] = fechaDeterminada.asientos
        const asientosLibres = (asientos.map(elem => {
            if(elem.token == null){
                return elem.numero
            }
        }))
        return res.status(200).json(
            "Free seats: " + asientosLibres
            )
    }else{
        return res.status(500).json("No hay coincidencias de fecha")
    }


}

export const free = async (req: Request, res: Response) => {
    const body = req.body
    if(!body){
        return res.status(500).json("Error, no hay body")
    }

    const day = parseInt(req.body.day as string)
    const month = parseInt(req.body.month as string)
    const year = parseInt(req.body.year as string)
    console.log(req.body.day as string + req.body.month as string + req.body.year as string)
    const valid = checkDateValidity(req.body.day as string,req.body.month as string,req.body.year as string)
    if(!valid){
        return res.status(500).json("Error de fecha")
    }

    const db:Db = req.app.get("db")
    
    const fechaDeterminada = await db.collection("practica3")
    .findOne({
            day:day,
            month:month,
            year:year
    })

    if(fechaDeterminada){
        const asientos:{numero:number, token:undefined}[] = fechaDeterminada.asientos
        let numeroDeMesa: number = 99999
        asientos.forEach(elem => {
            if((elem.token as unknown ) == req.headers.token){
                console.log(elem.token)
                numeroDeMesa = elem.numero
            }
        })
        
        if(numeroDeMesa == 99999){
            return res.status(500).json("No hay sitios para liberar/reservas")
        }else{

            db.collection("practica3").updateOne(
                {day:day,month:month,year:year,asientos:{numero:numeroDeMesa, token: req.headers.token}},
                {$set: {'asientos.$.token': null}}
            )
            return res.status(200).json("Eliminada la reserva de la mesa numero: " + numeroDeMesa)

        }
    }else{
        return res.status(500).json("No hay coincidencias de fecha")
    }
}





export const book = async (req:Request, res:Response) => {
    const day = parseInt(req.query.day as string)
    const month = parseInt(req.query.month as string)
    const year = parseInt(req.query.year as string)
    const numeroMesa = parseInt(req.query.numeroMesa as string)

    const valid = checkDateValidity(req.query.day as string,req.query.month as string,req.query.month as string)
    if(!valid){
        return res.status(500).json("Error de fecha")
    }
    const db:Db = req.app.get("db")

    const fecha = await db.collection("practica3")
        .findOne({
            day:day,
            month:month,
            year:year
        })

    if(fecha){//si la fecha esta en la base de datos
        const asientos:{numero:number, token:string}[] = fecha.asientos
        console.log(JSON.stringify(asientos))
        let libre = false
        asientos.forEach(elem => {
            console.log(elem.numero)
            console.log(elem.token)
            if (elem.numero == numeroMesa && elem.token == null){
                libre = true
            }
        })
        console.log((libre)) //----------------------------------------------------------------
        if(libre){ //si el asiento esta libre
            const numeroasiento = numeroMesa 
            db.collection("practica3").updateOne(
                {day:day,month:month,year:year,asientos:{numero:numeroasiento, token: null}},
                //'asientos.1.token': req.headers.token
                {$set: {
                    'asientos.$.token': req.headers.token
                }
            })
            let today = new Date().toLocaleDateString()
            return res.status(200).json(today + " Numero mesa: " + numeroMesa)
        }else{ //si el asiento no esta libre
            return res.status(404).json("El asiento no esta libre");
        }

    }else{ //si la fecha no esta en la base de datos
        return res.status(500).json("No hay coincidencias de fecha")
    }
}


export const mybookings = async (req: Request, res: Response) => {

    const dateActual = new Date().toLocaleDateString()
    const db:Db = req.app.get("db")
    const allElems = await db.collection("practica3").find().toArray()
    
    const arrayBookings:{day:number, month:number, year:number,numeroDeMesa:number}[] = []
   
    allElems.forEach(ele => {
        ele.asientos.forEach((elem:any) => {
            //console.log(elem.token + " " +elem.numero)
            if(elem.token == req.headers.token){
                console.log(elem.token)
                if(dateActual <= new Date(ele.day, ele.month, ele.year).toDateString()) //reservas futuras
                arrayBookings.push({
                    day: ele.day,
                    month: ele.month,
                    year:ele.year,
                    numeroDeMesa:elem.numero
                })
            }
        })
    })

    arrayBookings.forEach((booking:any) => console.log(booking))

    if(arrayBookings.length > 0){
        return res.status(200).json({
           "reservas": arrayBookings
        })
    }else{
        return res.status(404).json("No hay reservas")
    }

}

const checkDateValidity = (day:string, month:string, year:string):boolean => {
    const date = new Date(`${month} ${day}, ${year}`)
    return date.toString() !== "Invalid Date"
}
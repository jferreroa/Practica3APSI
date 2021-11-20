import {Db, MongoClient} from "mongodb";

import {asientos} from "./type";

export const getDB = async (): Promise<Db> => {
    const dbName:string = "Jaime"
    const collection:string = "practica3"
    const user:string = "user"
    const passw:string = "root"
    const uri:string =  `mongodb+srv://${user}:${passw}@cluster0.cg7qb.mongodb.net/${dbName}?retryWrites=true&w=majority`
    const client = new MongoClient(uri)


    try {
        await client.connect()
        console.log("Client connected")
        const docs: number = await client
            .db(dbName)
            .collection(collection)
            .countDocuments()

        if (docs > 0) {
            console.log("Sitios already in database")
            return client.db(dbName)
        }

        console.log("Generando base de datos")

        //5 fechas


        const asientosXD: asientos[] = []
        for(let i = 1; i < 21; i++){
            asientosXD.push({
                numero: i,
                token: undefined
            })
        }



        let x = 0
        while(x < 5) {
            let day =  Math.floor(Math.random() * (31))
            let month = 12
            let year = 2021


           
            await client.db(dbName).collection(collection).insertOne(
                {
                    day:day,
                    month:month,
                    year:year,
                    asientos:asientosXD
                }
            )

            x++

        }



        console.log("Base de datos generada")

        return client.db(dbName)
    }catch (e){
        throw (e)
    }

}

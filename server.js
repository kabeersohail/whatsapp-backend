//  importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
// app config 
const app = express();
const port = process.env.PORT || 9000; 

const pusher = new Pusher({
    appId: "1189583",
    key: "2a302de178aaf5fc1a6b",
    secret: "9a7c4b67d54109a1c39f",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json())

//DB config
const connection_url = 'mongodb://kabeer:xwZQeuKkiHVVDzbo@cluster0-shard-00-00.4lmra.mongodb.net:27017,cluster0-shard-00-01.4lmra.mongodb.net:27017,cluster0-shard-00-02.4lmra.mongodb.net:27017/whatsapp-db?ssl=true&replicaSet=atlas-88dvgx-shard-0&authSource=admin&retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.once("open",()=>{
    console.log("DB Connected");

    const msgCollections = db.collection("messagecontents"); 
    const changeStream = msgCollections.watch();

    changeStream.on("change",(change)=>{
        console.log("A change occured",change);

        if(change.operationType == 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('message','inserted',{
                name : messageDetails.user,
                message : messageDetails.message
            });
        }
        else{
            console.log('Error triggering pusher'); 
        }

    })

})

//app routes
app.get("/",(req,res) => res.status(200).send("wow its amazing") );

app.get("/messages/sync",(req,res) =>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }
    })
})



app.post("/messages/new",(req,res)=>{
    const dbMessage = req.body;
    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(201).send(data);
        }
    })
})

//listen
app.listen(port,()=> console.log(`Listening on localhost:${port}`));

//xwZQeuKkiHVVDzbo
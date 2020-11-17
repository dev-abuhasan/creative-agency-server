const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
// const fs = require('fs');
const fs = require('fs-extra')
require('dotenv').config();


//mongo DB info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zbfns.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//use App
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(express.static('./Public/UploadImg'));

//default directory
app.get('/', (req, res) => {
    res.send("TEAM PROJECT ABU HASAN, MAHBUB, KATHA")
})

//database area
client.connect(err => {
    const apartmentPublicData = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_PUBLIC_COLLECTION}`);

    const imgCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_IMG_COLLECTION}`);


    //post add-order
    app.post('/add-order', (req, res) => {
        const name = req.body.name;
        const phone = req.body.phone;
        const massage = req.body.massage;
        const serviceTitle = req.body.serviceTitle;
        const email = req.body.email;
        const location = req.body.location;
        const bathroomNum = req.body.bathroomNum;
        const bedroomNum = req.body.bedroomNum;
        const price = req.body.price;
        const statusOption = req.body.statusOption;
        const image = req.files.image;

        const ImgPath = `${__dirname}/Public/UploadImg/${image.name}`;
        image.mv(ImgPath, err => {
            if (err) {
                res.status(500).send({
                    success: false,
                    msg: 'Failed to upload image'
                });
            }
            const newImg = fs.readFileSync(ImgPath);
            const enCoImg = newImg.toString('base64');
            const createImg = {
                contentType: req.files.image.mimetype,
                size: req.files.image.size,
                img: Buffer.from(enCoImg, 'base64')
            };
            apartmentPublicData.insertOne({
                name, phone, serviceTitle, massage, email, location, bathroomNum, bedroomNum, price, statusOption, createImg
            })
                .then(result => {
                    fs.remove(ImgPath, errors => {
                        if (errors) {
                            res.status(500).send({
                                success: false,
                                msg: 'Failed to remove image'
                            });
                        }
                        res.status(200).send({
                            success: result.insertedCount > 0,
                            name: `${image.name}`,
                            msg: 'Image upload successful'
                        });
                    })
                })
        })

    });

    //get all services
    app.get('/all', (req, res) => {
        apartmentPublicData.find({})
            .toArray((err, docs) => {
                res.send(docs)
            })
    });

    //get userSpecific service list
    app.get('/user-service-list', (req, res) => {
        apartmentPublicData.find({ email: req.query.email })
            .toArray((err, docs) => {
                res.send(docs);
            })
    });

    //get with id for home details
    app.get('/details/:id', (req, res) => {
        const id = req.params.id;
        apartmentPublicData.find({ _id: ObjectId(id) })
            .toArray((err, docs) => {
                res.send(docs);
            })
    });

    //update status
    app.patch('/update-statue/:id', (req, res) => {
        apartmentPublicData.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: {
                    statusOption: req.body.statusOption
                }
            })
            .then(result => {
                res.status(200).send({
                    success: result.insertedCount > 0,
                    msg: 'Status update successful'
                });
            })
    })

    //delete
    app.delete('/delete-order/:id', (req, res) => {
        apartmentPublicData.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.status(200).send({
                    success: result.insertedCount > 0,
                    msg: 'Status update successful'
                });
            })
    })

    //add rent 
    app.post('/add-rent', (req, res) => {
        const name = req.body.name;
        const phone = req.body.phone;
        const email = req.body.email;
        const massage = req.body.massage;
        const serviceTitle = req.body.serviceTitle;
        const price = req.body.price;
        const id = req.body.id;
        imgCollection.insertOne({
            name, phone, email, massage, serviceTitle, price,id
        })
            .then(result => {
                res.status(200).send({
                    success: result.insertedCount > 0,
                    msg: 'Review Add successful'
                });
            });

    })
    
    //add rent 
    app.get('/all-rent', (req, res) => {
        const email = req.query.email;
        imgCollection.find({ email: req.query.email })
            .toArray((err, docs) => {
                res.send(docs);
            })


    })
    
    //asd
    app.get('/tasks', (req, res) =>{
        const filter = req.query.filter;
        apartmentPublicData.find({serviceTitle: {$regex: filter}})
        .toArray((err, documents) => {
            console.log(documents);
             res.status(200).send(documents);
        })
    })
});

app.listen(process.env.PORT || 5000);

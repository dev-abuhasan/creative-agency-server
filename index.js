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
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ubnkj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
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
    res.send("ABU HASAN")
})

//database area
client.connect(err => {
    //admin email collection
    const agencyAdminEmail = client.db(`${process.env.DB_NAME}`).collection(`${process.env.ADMIN_EMAIL_COLLECTION}`);
    //admin data base
    const agencyAdminData = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_ADMIN_COLLECTION}`);
    //public data base
    const agencyPublicData = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_PUBLIC_COLLECTION}`);
    //public review data base
    const agencyReviewData = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_PUBLIC_REVIEW}`);

    //post check admin or not
    app.post('/check-admin', (req, res) => {
        const email = req.body.email;
        agencyAdminEmail.find({ email: email })
            .toArray((err, doc) => {
                if (doc.length === 0) {
                    res.send({ admin: false });
                } else {
                    res.send({ admin: true });
                }
            })
    });

    //post make-admin
    app.post('/make-admin', (req, res) => {
        const addData = {
            email: req.body.email,
            adminAddBy: req.body.adminAddBy
        };
        agencyAdminEmail.insertOne(addData)
            .then(() => {
                res.json({ success: true })
            })
    })

    //post add-service
    app.post('/add-service', (req, res) => {
        const title = req.body.title;
        const description = req.body.description;

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
            agencyAdminData.insertOne({ title, description, createImg })
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

    })

    //post public review
    app.post('/set-review', (req, res) => {
        const reviewData = req.body.formData;
        agencyReviewData.insertOne(reviewData)
            .then((result) => {
                res.status(200).send({
                    success: result.insertedCount > 0,
                    msg: 'Review Add successful'
                });
            })
    })

    //post add-order
    app.post('/add-order', (req, res) => {
        const name = req.body.name;
        const email = req.body.email;
        const courseCategory = req.body.courseCategory;
        const projectDetails = req.body.projectDetails;
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
            agencyPublicData.insertOne({
                name, email, courseCategory, projectDetails, price, statusOption, createImg
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

    })

    //get all services
    app.get('/all-services', (req, res) => {
        agencyAdminData.find({})
            .toArray((err, docs) => {
                res.send(docs)
            })
    })

    //all-review get
    app.get('/all-review', (req, res) => {
        agencyReviewData.find({})
            .toArray((err, docs) => {
                res.send(docs);
            })
    })

    //get userSpecific service list
    app.get('/user-service-list', (req, res) => {
        agencyPublicData.find({ email: req.query.email })
            .toArray((err, docs) => {
                res.send(docs);
            })
    })

    //get all order data to admin
    app.get('/all-order-data/admin', (req, res) => {
        const email = req.query.email;
        agencyAdminEmail.find({ email: email })
            .toArray((err, doc) => {
                if (doc.length === 0) {
                    res.status(500).send({
                        success: false,
                        msg: 'Please Login in as a Admin'
                    });
                } else {
                    agencyPublicData.find({})
                        .toArray((err, docs) => {
                            res.send(docs);
                        })
                }
            })
    })

    //update status
    app.patch('/update-statue/:id', (req, res) => {
        agencyPublicData.updateOne({ _id: ObjectId(req.params.id) },
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
        agencyPublicData.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.status(200).send({
                    success: result.insertedCount > 0,
                    msg: 'Status update successful'
                });
            })
    })
});

app.listen(process.env.PORT || 5000);

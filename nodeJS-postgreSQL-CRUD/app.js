const express = require("express");
const pg = require("pg")
const multer = require("multer");
const env = require("dotenv");
const path = require("path");
const { title } = require("process");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

env.config()

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

db.connect((err) => {
    if (err) {
        console.log("Error connecting to the database: ", err)
        return
    }

    console.log("Connected to postgreSQL database successfully.")
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage });

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM products");
        res.render("home", {
            title: "Home",
            products: result.rows
        })
    } catch (error) {
        console.log(error)
    }
})

app.get("/create", (req, res) => {
    res.render("create", { title: "Create page"})
})

app.post("/create", upload.single("image"), (req, res) => {
    const { name, description } = req.body;
    const image = req.file ? req.file.filename : null;
    
    try {
        db.query("INSERT INTO products (name, description, image) VALUES ($1, $2, $3)",[name, description, image])
        res.redirect("/")
    } catch (error) {
        console.log(error)
    }

})

app.get("/about", (req, res) => {
    res.render("about", { title: "About" })
})

app.get("/contact", (req, res) => {
    res.render("contact", { title: "Contact"})
})

app.get("/edit/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const result = await db.query("SELECT * FROM products WHERE id = $1",[id])
        res.render("edit", {
            title: "Edit page",
            product: result.rows[0]
        })
    } catch (error) {
        console.log(error)
    }
})

app.post("/edit/:id", upload.single("image"), (req, res) => {
    const id = req.params.id;
    const { name, description } = req.body;
    const image = req.file ? req.file.filename : req.body.oldImage

    try {
        db.query("UPDATE products SET name = $1, description = $2, image = $3 WHERE id = $4",[name, description, image, id])
        res.redirect("/")
    } catch (error) {
        console.log(error)
    }
})

app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    try {
        db.query("DELETE FROM products WHERE id = $1", [id])
        res.redirect("/")
    } catch (error) {
        console.log(error)
    }
})

app.listen(port, () => {
    console.log("Server is running on port 3000.")
})
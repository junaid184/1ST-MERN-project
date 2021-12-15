import express from "express";
import morgan from "morgan";
const app = express();
import cors from "cors";
import path from "path";
const __dirname = path.resolve();
import { stringToHash, varifyHash } from "bcrypt-inzi";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";
dotenv.config();

// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1NNBNfAlwfs8mWvMPcA6ycgJA7GY5DD0",
  authDomain: "todoappication.firebaseapp.com",
  databaseURL: "https://todoappication-default-rtdb.firebaseio.com",
  projectId: "todoappication",
  storageBucket: "todoappication.appspot.com",
  messagingSenderId: "220292562540",
  appId: "1:220292562540:web:f3e365f964c3f50816e249",
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
import multer from "multer";

const storageMulter = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${new Date().getTime()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storageMulter });
const SECRET = process.env.SECRET || "12345";
const PORT = process.env.PORT || 8000;

// const dbURL = 'mongodb+srv://INNO:Inno@cluster0.nr4e4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const dbURL =
  "mongodb+srv://junaid:Junaid@cluster0.syy28.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import { async } from "@firebase/util";
mongoose.connect(dbURL);
const USER = mongoose.model("Users", {
  fullName: String,
  email: String,
  password: String,
  address: String,
  created: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Posts", {
  fullName: String,
  email: String,
  postText: String,
  userId: String,
  URL: String,
  imgStrPath: String,
  created: {
    type: Date,
    default: Date.now,
  },
});
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8000"],
    credentials: true,
  })
);
app.use("/", express.static(path.join(__dirname, "web/build")));
app.get("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "./web/build/index.html"));
  // res.redirect("/")
});
app.post("/api/v1/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log("email and password is required");
    res.status(403).send("required field is missing");
  }
  USER.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      res.status(500).send("error in getting database");
    } else {
      if (user) {
        console.log(user);
        varifyHash(req.body.password, user.password)
          .then((result) => {
            console.log("result: ", result);
            if (result) {
              var token = jwt.sign(
                {
                  fullName: user.fullName,
                  email: user.email,
                  address: user.address,
                  _id: user._id,
                },
                SECRET
              );

              res.cookie("token", token, {
                httpOnly: true,
                maxAge: 86400000,
              });

              res.send({
                fullName: user.fullName,
                email: user.email,
                address: user.address,
                _id: user._id,
              });
            } else {
              res.status(401).send("Authentication Failed");
            }
          })
          .catch((e) => {
            console.log(e.message);
          });
      } else {
        res.send("user not found");
      }
    }
  });
});

app.post("/api/v1/signup", (req, res) => {
  if (!req.body.email || !req.body.fullName || !req.body.address) {
    console.log("Field is missing");
    res.status(403).send("field is missing");
  } else {
    USER.findOne({ email: req.body.email }, (err, email) => {
      if (err) {
        res.status(500).send("error in getting database");
      } else if (email) {
        res.status(403).send("email already exist");
      } else {
        stringToHash(req.body.password)
          .then((passwordHash) => {
            console.log("hash: ", passwordHash);
            let newUser = new USER({
              fullName: req.body.fullName,
              email: req.body.email,
              password: passwordHash,
              address: req.body.address,
            });
            newUser.save(() => {
              console.log("data saved, profile has been created");
              res.send("profile has been created");
            });
          })
          .catch((e) => {
            console.log(e.message);
          });
      }
    });
  }
});
app.use((req, res, next) => {
  jwt.verify(req.cookies.token, SECRET, (err, decoded) => {
    req.body._decoded = decoded;

    if (!err) {
      next();
    } else {
      res.status(401).sendFile(path.join(__dirname, "./web/build/index.html"));
    }
  });
});

app.post("/api/v1/logout", (req, res, next) => {
  res.cookie("token", "", {
    httpOnly: true,
    maxAge: 300000,
  });
  res.send();
});

app.get("/api/v1/profile", (req, res) => {
  USER.findOne({ email: req.body._decoded.email }, (err, user) => {
    if (err) {
      res.status(500).send("error in getting database");
    } else {
      if (user) {
        res.send({
          fullName: user.fullName,
          email: user.email,
          _id: user._id,
        });
      } else {
        res.send("user not found");
      }
    }
  });
});

app.post("/api/v1/post", upload.any(), async (req, res) => {
  if (!req.files || !req.body.postText) {
    res.status(400).send("file is missing");
    return;
  } else if (req.files[0].size > 20000) {
    res.status(400).send("file size is greater than 2MB");
  } else {
    const file = await readFile(req.files[0].path);
    const storageRef = ref(storage, "postImage/" + req.files[0].filename);
    console.log(storageRef);
    let uploadTask = uploadBytesResumable(storageRef, file);
    console.log(uploadTask);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("upload is paused");
            break;
          case "running":
            console.log("upload is running");
            break;
        }
      },
      (error) => {
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            break;
          case "storage/canceled":
            // User canceled the upload
            break;

          // ...

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            break;
        }
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log("file avalaible at: ", downloadURL);
        });
      }
    );
  }
});

app.get("/api/v1/posts", (req, res) => {
  const page = Number(req.query.page);

  console.log("page: ", page);

  Post.find({})
    .sort({ created: "desc" })
    .skip(page)
    .limit(2)
    .exec(function (err, data) {
      res.send(data);
    });
});

app.get("/**", (req, res, next) => {
  // res.sendFile(path.join(__dirname, "./web/build/index.html"))
  res.redirect("/");
});

const server = createServer(app);

const io = new Server(server, { cors: { origin: "*", methods: "*" } });

io.on("connection", (socket) => {
  console.log("New client connected with id: ", socket.id);

  // to emit data to a certain client
  socket.emit("topic 1", "some data");

  // collecting connected users in a array
  // connectedUsers.push(socket)

  socket.on("disconnect", (message) => {
    console.log("Client disconnected with id: ", message);
  });
});

server.listen(PORT, function () {
  console.log("server is running on", PORT);
});

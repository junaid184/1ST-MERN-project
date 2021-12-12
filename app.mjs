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
import { readFile } from "fs/promises";
import { unlink } from "fs/promises";
import {
  ref,
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import dotenv from "dotenv";
dotenv.config();

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpNllUq4kLNYzsSOBstf15X2jsaHU1bKI",
  authDomain: "owlkids-af985.firebaseapp.com",
  projectId: "owlkids-af985",
  storageBucket: "owlkids-af985.appspot.com",
  messagingSenderId: "176162046515",
  appId: "1:176162046515:web:24a7dc40b803a327f55946",
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
  console.log(req.body);
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
                maxAge: 300000,
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
  // const newPost = new Post({
  //   fullName: req.body._decoded.fullName,
  //   email: req.body._decoded.email,
  //   postText: req.body.postText,
  //   userId: req.body._decoded._id,
  // });
  // newPost.save().then(() => {
  //   console.log("Post Created");
  //   io.emit("POSTS", {
  //     fullName: req.body._decoded.fullName,
  //     email: req.body._decoded.email,
  //     postText: req.body.postText,
  //     userId: req.body._decoded._id,
  //   });
  //   res.send("Post Created");
  // });
  if (!req.files || !req.body.text) {
    res.status(400).send("file is missing");
    return;
  }
  if (req.files[0].size > 2000000) {
    res.status(400).send("file size should not be greater than 2MB");
    return;
  }
  try {
    const file = await readFile(req.files[0].path);
    const storageRef = ref(storage, "postImages/" + req.files[0].filename);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
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
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log("File available at", downloadURL);
          try {
            await unlink(req.files[0].path);
            console.log("File Deleted");
            const newpost = await new Post({
              fullName: req.body._decoded.fullName,
              email: req.body._decoded.email,
              postText: req.body.postText,
              userId: req.body._decoded._id,
              URL: downloadURL,
              imgStrPath: req.files[0].filename,
            });
            newpost.save().then((data) => {
              io.emit("POSTS", {
                postText: req.body.postText,
                Url: downloadURL,
                imgStrPath: req.files[0].filename,
                fullName: req.body._decoded.fullName,
                userId: req.body._decoded._id,
                _id: data._id,
              });
              res.send("Post created");
            });
          } catch (error) {
            console.log(error);
            res.status(500).send("Error in storage");
          }
        });
      }
    );
  } catch (error) {
    res.status(500).send("Internal Server Error");
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

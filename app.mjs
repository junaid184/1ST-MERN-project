import express from "express";
const app = express();
import cors from "cors"
import path from "path";
const __dirname = path.resolve();
import { stringToHash, varifyHash } from "bcrypt-inzi";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import postmark from "postmark"
const SECRET = process.env.SECRET || "12345";
const POSTMARK_KEY = process.env.POSTMARK_KEY || "b62230d6-744d-4a8a-9f41-d30e11819f1c";
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

const Otp = mongoose.model('Otp', {
  email: String,
  otp: String,
  used: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
});

const Post = mongoose.model("Posts", {
    fullName: String,
    email: String,
    postText: String,
    userId: String,
    created: {
    type: Date,
    default: Date.now,
    },
});
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:8000"],
  credentials: true
}))
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

app.post('/api/v1/otp', (req, res, next) => {

  if (!req.body.email) {
      console.log("required field missing");
      res.status(403).send("required field missing");
      return;
  }
  console.log("req.body: ", req.body);

  USER.findOne({ email: req.body.email }, (err, user) => {

      if (err) {
          res.status(500).send("error in getting database")
      } else {
          if (user) {

              function getRandomArbitrary(min, max) {
                  return Math.random() * (max - min) + min;
              }
              const otp = getRandomArbitrary(1111, 9999).toFixed(0);

              stringToHash(otp).then(hash => {

                  let newOtp = new Otp({
                      email: req.body.email,
                      otp: hash
                  })
                  newOtp.save((err, saved) => {
                      if (!err) {

                          client.sendEmail({
                              "From": "junaid.12194@iqra.edu.pk",
                              "To": req.body.email,
                              "Subject": "forget password OTP",
                              "TextBody": `Hi ${user.fullName}, your 4 digit OTP is: ${otp}`
                          }).then((success, error) => {
                              if (!success) {
                                  console.log("postmark error: ", error)
                              }
                          });

                          res.send({ otpSent: true, message: "otp genrated" });
                      } else {
                          console.log("error: ", err);
                          res.status(500).send("error saving otp on server")
                      }
                  })
              })

          } else {
              res.send("user not found");
          }
      }
  })
})

app.post('/api/v1/forget',(req, res, next)=>{
  if(!req.body.email || !req.body.otp || !req.body.newPassword)
  {
    res.send(403).send('field is missing')
    return;
  }
  else
  {
    Otp.findOne({email: req.body.email})
    .sort({_id: -1})
    .exec((e, otp)=>{
      if(e)
      {
        res.status(500).send('error in getting otp')
      }
      else if(otp)
      {
        const created = new Date(otp.created).getTime;
        const now = new Date().getTime;
        const diff = now-created;

        if(diff>300000 || otp.used)
        {
          res.status(401).send('otp invalid');
        }
        else
        {
          varifyHash(req.body.otp, otp.otp).then((isMatch)=>{
            if(isMatch)
            {
              stringToHash(req.body.newPassword).then((hashPassword)=>{
                USER.findOneAndUpdate({email: req.body.email}, 
                  {password: hashPassword},
                  {},
                  (e, updated)=>{
                    if(e)
                    {
                      res.status(500).send('error updating password')
                    }
                    else{
                      res.send('password updated');
                    }
                  })
              })
              otp.update({used: true})
              .exed((e, updated)=>{
                if(e)
                {
                  console.log("otp update fail: ", e);
                }
                else{
                  console.log('otp updated')
                }
              })
            }
            else{
              res.status(401).send('invalid otp');
            }
          })
        }
      }
      else
      {
        res.status(400).send('invalid otp')
      }
    })
  }
})

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

app.get('/api/v1/profile', (req, res) => {
  USER.findOne({ email: req.body._decoded.email }, (err, user) => {

      if (err) {
          res.status(500).send("error in getting database")
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
  })
})

app.post("/api/v1/post", (req, res) => {
    const newPost = new Post({
        fullName: req.body._decoded.fullName,
        email: req.body._decoded.email,
        postText: req.body.postText,
        userId: req.body._decoded._id,
    })
    newPost.save().then(()=>{
        console.log("Post Created");
        io.emit("POSTS",{
          fullName: req.body._decoded.fullName,
          email: req.body._decoded.email,
          postText: req.body.postText,
          userId: req.body._decoded._id,
      })
        res.send("Post Created")
    })
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

const io = new Server(server, { cors: { origin: "*", methods: "*", } });

io.on("connection", (socket) => {
    console.log("New client connected with id: ", socket.id);

    // to emit data to a certain client
    socket.emit("topic 1", "some data")

    // collecting connected users in a array
    // connectedUsers.push(socket)

    socket.on("disconnect", (message) => {
        console.log("Client disconnected with id: ", message);
    });
});

server.listen(PORT, function () {
  console.log("server is running on", PORT);
})


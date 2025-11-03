import express from "express";
import session from "express-session";
// import Stripe from "stripe";
import dotenv from 'dotenv';
import multer from "multer";
import path from 'path';

dotenv.config();
// const stripe = new Stripe(process.env.STRIPE_SECRET);
const app = express();
import {
  sign,
  logIn,
  CheckTeacherState,
  makeAsTeacher,
  findUserInfo,
  createCourse,
  findCourses,
  uploadVideo,
  callCourses,
  callVideosByCid,
  createCart,
  callCartItems,
  markAsPaid,
  sendCartStateBy
} from "./database.js";
import { name } from "ejs";

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use("/", express.static("public"));
app.use('/uploads',express.static('uploads'));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//set image upload

const storage = multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null,'uploads/');
  },
  filename:(req,file,cb) =>{
    const uniqueName = Date.now() + '_' + file.originalname;
    cb(null,uniqueName);
  }
});

const upload = multer({storage});



app.get("/home", (req, res) => {
  res.render("home.ejs", { email: req.session.email });
});
app.get("/UserLogin", (req, res) => {
  res.render("form.ejs", { state: "signin" });
});

app.get("/teacher/login", (req, res) => {
  res.render("teacherLogin.ejs",{state:"Login",email:req.session.email});
});

app.get("/teacher", async function (req, res) {
  const user = await findUserInfo(req.session.email);
  res.render("teacher.ejs", {
    email: user.email,
    name: user.name,
    id: user._id,
    message: req.session.Teachermessage,
  });
});

app.post("/teacher/sign", async function (req, res) {
  const sign = await makeAsTeacher(req.body.email, req.body.description);
  console.log(sign);
  if (sign) {
    req.session.email = req.body.email;
    req.session.Teachermessage = "SignIn succussfully";
    res.redirect("/teacher");
  }
});

app.post("/teacher/login", async function (req, res) {
  const loginState = await CheckTeacherState(req.body.email, req.body.password);
  if (loginState === "wrongcreditionals") {
    res.render("teacherLogin.ejs", { error: loginState ,state:"Login"});
  } else if (loginState) {
    req.session.email = req.body.email;
    req.session.Teachermessage = "Login succussfully";
    res.redirect("/teacher");
  } else res.render("teacherLogin.ejs", { email: req.body.email,state:"Sign" });
});

app.get("/content", (req, res) => {
  res.render("course.ejs");
});

app.post("/login", async function (req, res) {
  const loginstate = await logIn(req.body.email, req.body.password);
  if (loginstate) {
    req.session.email = req.body.email;
    res.redirect('/home');
  } else {
    console.log("error");
    res.render("form.ejs", {
      state: "signin",
      error: "check email and password. make sure if you register before",
      email: req.body.email,
    });
  }
});

app.post("/register", async function (req, res) {
  const register = sign(req.body.name, req.body.email, req.body.password);
  if (register) {
    req.session.email = req.body.email;
    res.redirect('/home')
  } else {
    res.render("form.ejs", { name: req.body.name, state: "register" });
  }
});

app.post("/createCourse",upload.single('image'), async function (req, res) {
  const course = await createCourse(
    req.file.filename,
    req.body.id,
    req.body.courseName,
    req.body.CourseDescription,
    req.body.price
  );
  if (course) {
    req.session.Teachermessage = "Course created succussfully";
    res.redirect("/teacher");
  } else res.send("failed");
});

app.post("/courses", async (req, res) => {
  try {
    const { teacherId } = req.body;
    const courses = await findCourses(teacherId);
    res.json(courses);
  } catch (err) {
    console.log("TecherId not found");
  }
});

app.post("/addtocart",async (req,res)=> {
  const {courseId} = req.body;
  const create = await createCart(courseId,req.session.email);
  const message = {'message':create}
  res.json(message)
})

app.get("/callCourses", async (req, res) => {
  const courses = await callCourses();
  res.json(courses);
});

app.get("/cartItems",async (req,res)=>{
  const cartItems = await callCartItems(req.session.email);
  res.json(cartItems);
})

app.post("/uploadVideo",upload.single('video'), async (req, res) => {
  const video = await uploadVideo(
    req.file.filename,
    req.body.courseId,
    req.body.videoName,
    req.body.videoDescription
  );
  if (video) {
    req.session.Teachermessage = video;
    res.redirect("/teacher");
  }
});
app.get("/course/:id", async (req, res) => {
  try {
    res.render('course.ejs')
  } catch (err) {
    console.log("error is", err);
  }
});
app.get("/videos/:id", async (req, res) => {
  try {
    const courseInfo = await callVideosByCid(req.params.id);
    res.json(courseInfo);
  } catch (err) {
    console.log("video find error in /videos");
  }
});

app.get("/enroll/:id",(req,res)=>{
  res.render('enroll.ejs',{courseId:req.params.id})
})

app.get("/cart",(req,res)=>{
  res.render('cart.ejs')
})
app.post('/pay',async (req,res)=>{
  const {title,price} = req.body;
  res.redirect('/success');
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types:['card'],
  //   line_items:[
  //     {price_data:{
  //       currency: 'usd',
  //       product_data:{
  //         name:title
  //       },
  //       unit_amount:parseFloat(price) * 100,
  //     },
  //   quantity:1,},
  //   ],
  //   mode:'payment',
  //   success_url:'http://localhost:3000/success',
  //   cancel_url:'http://localhost:3000/cancel',
  // });
  // res.redirect(session.url);
})
app.get('/success',async (req,res)=>{
  console.log(req.session.email)
  const paid = await markAsPaid(req.session.email);
  console.log('paid mark okay. server.js');
  res.render('success.ejs',{email:req.session.email})
})

app.get('/carts/:id',async (req,res)=>{
  try {
    const cartstatus = await sendCartStateBy(req.params.id);
    res.json(cartstatus);
  } catch (err) {
    console.log("video find error in /carts");
  }
})


app.listen(3000);

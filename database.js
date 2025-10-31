import { name } from "ejs";
import mongoose from "mongoose";

async function ConnectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/courseEnroll");
    console.log("connected to dbms");
  } catch (err) {
    console.log("Something went wrong on dbms connect");
  }
}

ConnectDB();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  description: String,
});

const courseShemma = new mongoose.Schema({
  image:String,
  name: String,
  description: String,
  price: Number,
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const videoShema = new mongoose.Schema({
  video:String,
  name: String,
  description: String,
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
});

const cartShema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: String,
});

const cart = mongoose.model("Cart", cartShema);
const video = mongoose.model("video", videoShema);
const course = mongoose.model("Course", courseShemma);
const user = mongoose.model("User", userSchema);
export async function createCart(courseId, userEmail) {
  const user = await findUserInfo(userEmail);
  const userid = user._id;
  const newCart = new cart({
    userId: userid,
    courseId: courseId,
    status: "cart",
  });

  await newCart.save();
  return "Added to cart succussfully";
}

export async function createCourse(
  imgname,
  teacherId,
  courseName,
  courseDescription,
  coursePrice
) {
  try {
    const newCourse = new course({
      image:imgname,
      name: courseName,
      description: courseDescription,
      price: coursePrice,
      teacherId: teacherId,
    });

    await newCourse.save();
    return "course created successfully";
  } catch (err) {
    console.log("course create error", err);
    return false;
  }
}

export async function uploadVideo(videoname,courseId, name, description) {
  try {
    const newVideo = new video({
      video:videoname,
      name: name,
      description: description,
      courseId: courseId,
    });
    await newVideo.save();
    return "video created succefully";
  } catch (err) {
    console.log("error seems:", err);
  }
}

export async function sign(name, email, password) {
  try {
    const newUser = new user({
      name: name,
      email: email,
      password: password,
      role: "student",
    });
    await newUser.save();
    console.log(newUser);
    return true;
  } catch (err) {
    console.log("something went wrong in create user and save");
    return false;
  }
}

export async function logIn(email, password) {
  const db_email = await user.findOne({ email: email });
  if (db_email) {
    if (db_email.password === password) {
      return true;
    } else {
      return false;
    }
  } else return false;
}

export async function CheckTeacherState(email, password) {
  if (await logIn(email, password)) {
    const teacher = await user.findOne({ email: email });
    if (teacher.role === "teacher") {
      return true;
    } else return false;
  } else return "wrongcreditionals";
}

export async function makeAsTeacher(email, description) {
  const teacher = await user.findOne({ email: email });
  if (teacher) {
    teacher.role = "teacher";
    teacher.description = description;
    await teacher.save();
    return true;
  }
}

export async function findUserInfo(email) {
  const findUser = await user.findOne({ email: email });
  if (findUser) {
    return findUser;
  } else return false;
}

export async function findCourses(teacherId) {
  const courses = await course.find({ teacherId: teacherId });
  return courses;
}

export async function callCourses() {
  const courses = await course.find().populate("teacherId", "name");
  return courses;
}

export async function callVideosByCid(course_id) {
  const videos = await video.find({ courseId: course_id });
  const teacher = await course
    .find({ _id: course_id })
    .populate("teacherId", "name");
  return { videos: videos, courseInfo: teacher };
}

export async function callCartItems(email) {
  const user = await findUserInfo(email);
  const cartitems = await cart
    .find({ userId: user })
    .populate("courseId", "name description price");
  return cartitems;
}

export async function markAsPaid(email) {
  const cartitems = await callCartItems(email);
  console.log(cartitems);
  cartitems.forEach(async (i) =>{
    i.status = 'paid'
    await i.save();
    console.log('saved');
  });
  return 'success';
}

export async function sendCartStateBy(courseid) {
  const cartitems = await cart.find({courseId:courseid});
  if(cartitems.length > 0){
    const status = cartitems[0].status;
    return status;
  }else{
    return "notavalable"
  }
}


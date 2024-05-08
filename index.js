import express from "express";
import bodyParser from "body-parser";
import path from "path";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {initializeApp} from "firebase/app";

// import { getAnalytics } from "firebase/analytics";

import {getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import multer from "multer";

//Express

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
const saltRounds = 5;
env.config();

//MiddleWares

app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: false,//true
  })
);

// app.use(cookieSession({
//   name: 'session',
//   keys: ['TOPSECRETWORD'],
//   maxAge: 60 * 60 * 1000 // 24 hours
// }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "CampusLearnPro",
  password: "1234",
  port: 5432,
});
db.connect();

// Initialize Firebase

const firebaseConfig = {
  apiKey: "AIzaSyAl7Qva-JwDaMOcdKXQnqyQsmJwhpwaD4M",
  authDomain: "e-learning-platform-93488.firebaseapp.com",
  projectId: "e-learning-platform-93488",
  storageBucket: "e-learning-platform-93488.appspot.com",
  messagingSenderId: "519068910735",
  appId: "1:519068910735:web:13c202b8bf76009f4a1cfa",
  measurementId: "G-76V7XCX0CP"
};

const config = initializeApp(firebaseConfig);
// const analytics = getAnalytics(config);

const storage = getStorage();
const upload = multer({storage: multer.memoryStorage() });

async function allMaterials(courseID, unitID) {
  const result = await db.query(
    "SELECT * FROM materials WHERE course_id = ($1) AND unit_id = ($2)", [courseID, unitID]
  );
  let materials = [];
  result.rows.forEach((material) => {
    materials.push(material);
  });
  return materials;
}

app.post("/addMaterial", upload.single("material-link"), async (req, res) => {
  try {
    
    // const dateTime = new Date();
    console.log(req.body);  
    const courseID = req.body["course-id"];
    const unitID = req.body["unit-id"];
    const name = req.body["material-name"]; 
    const type = req.body["material-type"];
    
    const storageRef = ref(storage, `files/${req.file.originalname}`);
    
    const metadata = {
      contentType: req.file.mimetype,
    };
    
    const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    db.query("INSERT INTO materials (course_id, unit_id, name, type, link) VALUES ($1, $2, $3, $4, $5)", [courseID, unitID, name, type, downloadURL]);
    
    console.log("File successfully uploaded.");
    
    res.redirect(`/courses/view${courseID}/unit${unitID}`);
  

  }

  catch (error) {
    return res.status(400).send(error.message);
  }
});

app.post("/addResources", upload.single("material-link"), async (req, res) => {
  try {
    
    // const dateTime = new Date();
    const name = req.body["material-name"]; 
    const subtitle = req.body["material-subtitle"];
    const type = req.body["material-type"];
    
    const storageRef = ref(storage, `files/${req.file.originalname}`);
    
    const metadata = {
      contentType: req.file.mimetype,
    };
    
    const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    db.query("INSERT INTO resources (name, subtitle, type, link) VALUES ($1, $2, $3, $4)", [name, subtitle, type, downloadURL]);
    
    console.log("File successfully uploaded.");
    
    res.redirect(`/resources`);
  }

  catch (error) {
    return res.status(400).send(error.message);
  }
});


app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

async function allCourses() {
  const result = await db.query(
    "SELECT * FROM courses"
  );
  let courses = [];
  result.rows.forEach((course) => {
    courses.push(course);
  });
  return courses;
}

app.get("/courses", async (req, res) => {
  if (req.isAuthenticated()) {
    const courses = await allCourses();
    if (req.user.isadmin) {
      res.render("courses.ejs", { user: req.user , adminCourses: courses});
    } else {
      res.render("courses.ejs", { user: req.user, studentCourses: courses });
    }
  } else {
    res.redirect("/");
  }
});


app.post("/addCourses", async (req, res) => {
  const courseName = req.body["course-name"];
  const teacherName = req.body["teacher-name"];


    await db.query("INSERT INTO courses (title, teacher_name) VALUES ($1, $2)", [courseName,teacherName]);
    res.redirect("/courses");
});

async function allUnits(courseId) {
  const result = await db.query("SELECT * FROM units where course_id = ($1)", [courseId]);
  let units = [];
  result.rows.forEach((unit) => {
    units.push(unit);
  });
  return units;
}

// let courseLength;
app.get("/courses/view:courseId", async (req, res) => {
  if (req.isAuthenticated()) {
      const courses = await allCourses();
      const courseId = req.params.courseId;
      let course;
      for(let i = 0; i < courses.length; i++){
        if(courses[i].id == courseId){
          course = courses[i];
          break;
        }
      };

      if(course){
        const units = await allUnits(courseId);
        console.log(course);
        console.log(units);
        res.render("view.ejs", { user: req.user, currentCourse: course ,courseUnits: units});
      }else{
        res.status(404).send('Course not found');
      }
  } else {
    res.redirect("/");
  }
});



app.post("/addUnits", async (req, res) => {
  const unitName = req.body["unit-name"];
  const courseId = req.body["course-id"];

  await db.query("INSERT INTO units (unit_name, course_id) VALUES ($1, $2)", [unitName,courseId]);
  res.redirect(`/courses/view${courseId}`);
});

app.get("/courses/view:courseId/unit:unitId", async (req, res) => {
  if (req.isAuthenticated()) {
      const courses = await allCourses();
      const courseId = req.params.courseId;
      let course;
      for(let i = 0; i < courses.length; i++){
        if(courses[i].id == courseId){
          course = courses[i];
          break;
        }
      };

      const units = await allUnits(courseId);
      const unitId = req.params.unitId;
      let unit;
      for(let i = 0; i < units.length; i++){
        if(units[i].id == unitId){
          unit = units[i];
          break;
        }
      };

      const materials = await allMaterials(courseId, unitId);

      console.log(materials);

      res.render("units.ejs", { user: req.user, currentCourse: course, currentUnit: unit, unitMaterials: materials});
  } else {
    res.redirect("/");
  }
});

app.get("/clubs", (req, res) => {
  if (req.isAuthenticated()) {
    // if (req.user.isadmin) {
      res.render("clubs.ejs", { user: req.user });
    // }
  } else {
    res.redirect("/");
  }
});

async function allStudents() {
  const result = await db.query(
    "SELECT * FROM users WHERE isadmin = ($1)", [false]
  );
  let students = [];
  result.rows.forEach((student) => {
    students.push(student);
  });
  return students;
}

async function allAttendance() {
  const result = await db.query(
    "SELECT user_id, users.name, classes_attended, total_classes FROM attendance JOIN users ON attendance.user_id = users.id",
  );
  let attendences = [];
  result.rows.forEach((attendence) => {
    attendences.push(attendence);
  });
  return attendences;
}

async function getUserId(name){
  const result = await db.query("SELECT id FROM users WHERE name = $1 AND isadmin = $2", [name, false]);
  console.log(result);
  let id = parseInt(result.rows[0].id); 
  return id;
}

app.get("/progress", async (req, res) => {
  if (req.isAuthenticated()) {
    // if (req.user.isadmin) {
      const students = await allStudents();
      const attendances = await allAttendance();

      console.log(attendances);

      res.render("progress.ejs", { user: req.user, studentAtt: attendances });
    // }
  } else {
    res.redirect("/");
  }
});

app.post('/submit-table', async (req, res) => {
  const tableData = req.body;
  for (const data of tableData) {
    let id = await getUserId(data.name);
    await db.query("INSERT INTO attendance (user_id, classes_attended, total_classes) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET classes_attended = EXCLUDED.classes_attended, total_classes = EXCLUDED.total_classes;", [id, data.attended, data.total]);
  }
  // tableData.forEach(async data => {
  //   let id = getUserId(data.name);
  //   await db.query("INSERT INTO attendance (user_id, classes_attended, total_classes) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET classes_attended = EXCLUDED.classes_attended, total_classes = EXCLUDED.total_classes;",[id , data.attended, data.total]);
  // });
  console.log(tableData);
  res.send('Table data received successfully');
});

app.get("/tests", (req, res) => {
  if (req.isAuthenticated()) {
    // if (req.user.isadmin) {
      res.render("tests.ejs", { user: req.user });
    // }
  } else {
    res.redirect("/");
  }
});

async function allResources() {
  const result = await db.query(
    "SELECT * FROM resources"
  );
  let resources = [];
  result.rows.forEach((resource) => {
    resources.push(resource);
  });
  return resources;
}

app.get("/resources", async (req, res) => {
  if (req.isAuthenticated()) {
    const resources = await allResources();
    console.log(resources);
    // if (req.user.isadmin) {
      res.render("resources.ejs", { user: req.user, resources: resources });
    // }
  } else {
    res.redirect("/");
  }
});

// app.get("/help", (req, res) => {
//   res.sendFile(__dirname + "/public/help.html");
// });

app.post("/studentRegister", async (req, res) => {
  const name = req.body.name;
  const username = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (checkResult.rows.length > 0) {
      req.redirect("/");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (name, username, password, isAdmin) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, username, hash, false]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/courses");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/adminRegister", async (req, res) => {
  const name = req.body.name;
  const username = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (checkResult.rows.length > 0) {
      req.redirect("/");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (name, username, password, isAdmin) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, username, hash, true]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/courses");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/studentLogin",
  passport.authenticate("local", {
    successRedirect: "/courses",
    failureRedirect: "/",
  })
);

app.post("/adminLogin",
  passport.authenticate("local", {
    successRedirect: "/courses",
    failureRedirect: "/",
  })
);

// passport.use(
//   new Strategy(async function verify(username, password, cb) {
//     try {
//       const result = await db.query(
//         "SELECT * FROM users WHERE username = $1 ",
//         [username]
//       );
//       if (result.rows.length > 0) {
//         const user = result.rows[0];
//         const storedHashedPassword = user.password;
//         bcrypt.compare(password, storedHashedPassword, (err, valid) => {
//           if (err) {
//             //Error with password check
//             console.error("Error comparing passwords:", err);
//             return cb(err);
//           } else {
//             if (valid) {
//               //Passed password check
//               return cb(null, user);
//             } else {
//               //Did not pass password check
//               return cb(null, false);
//             }
//           }
//         });
//       } else {
//         return cb("User not found");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   })
// );

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const users = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      if (users.rows.length > 0) {
        const user = users.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

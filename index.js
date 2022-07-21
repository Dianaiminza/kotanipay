const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
var admin = require('firebase-admin');
var serviceAccount = require("./secret/config.json");
var multer = require('multer');
var path = require('path');
const saltedMd5=require('salted-md5')

app.use(cors());
const upload=multer({storage: multer.memoryStorage()})

require('dotenv').config()
app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'))
// app.use(express.static(path.join(__dirname, '//frontend/public')));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:"https://console.firebase.google.com/project/portfolio-88cee/firestore",
  storageBucket: process.env.BUCKET_URL
});

const db = admin.firestore();
const userService = require("./user_service");
app.locals.bucket = admin.storage().bucket();
// Cloud storage
app.post('/upload',upload.single('file'),async(req,res)=>{
    try {
    const name = saltedMd5(req.file.originalname, 'SUPER-S@LT!') 
  const fileName =(req.file.originalname)
  await app.locals.bucket.file(fileName).createWriteStream().end(req.file.buffer);
  res.json({
    fileName
  })
  } catch (error) {
    res.json({
      success:false,
      message:"file not uploaded"
    })
  }
  })

app.get("/upload", upload.single('file'),async(req,res) => {
  try {
        const bucket = admin.storage().bucket();
        const fileName =(req.file.originalname)
        const file = bucket.file(fileName);
        const signedURLconfig = { action: 'read', expires: '08-12-2025' }; 
        const signedURLArray = await file.getSignedUrl(signedURLconfig);
        const url = signedURLArray[0];
        await admin.firestore().collection('image').add({ fileName: fileName, signedURL: url })
        res.json({
          fileName,
          url
        })
    } catch (error) {
        res.json({
          success:false,
          message:"file not uploaded"
        })
    }
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userService.addUser(email, password);
    res.status(201).json(user);
  } catch (err) {
    res.json({
      success:false,
      message:"no user added"
     });
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userService.authenticate(email, password);
    res.json(user);
  } catch (err) {
    res.status(404).json({ 
      success:false,
      message:"no user found"
    });
  }
});

app.get("/me", (req, res) => {
  res.json({
    Name: "Diana Iminza",
    description:"Junior Web developer",
    skills:"HTML/CSS|Bootstrap|JavaScript|React|Node|"
  });
});

async function storeProject(project) {
    const docRef = await db.collection('Project').add(project)
    console.log('Added document with ID: ', docRef.id);
}
async function storeBlog(Blog) {
  const docRef = await db.collection('Blog').add(Blog)
}
async function getBlogs() {
  const snapshot = await db.collection('Blog').get()
  const collection = [];
  snapshot.forEach(doc => {
    let blog=doc.data();
    blog['id']=doc.id
      collection.push(blog);
  });
  return collection;
}

async function getProjects() {
  const snapshot = await db.collection('Project').get()
  const collection = [];
  snapshot.forEach(doc => {
    let project=doc.data();
    project['id']=doc.id
      collection.push(project);
  });
  return collection;
}

app.post("/projects", cors(), async (req,res) =>{
     var title     = req.body.title;
	  var description = req.body.description;
	  var url   = req.body.url;
	  var projectid = req.body.projectid;
    var projectimg=req.body.projectimg;
    
	    var project  = {
	        title: title,
	        description: description,
	        projectid: projectid,
	        url: url,
          projectimg: projectimg
	      };
        res.json({
          project
        })  
          await storeProject( project);
          return project
      
})
app.get('/projects/:id', cors(),async (req,res) =>{
   const snapshot = await db.collection("Project").get();
   snapshot.forEach((doc) => {
    console.log(doc.id, '=>', doc.data());
     project=doc.data();
    project['id']=doc.id
      
     })
  console.log(project)
  if(project){
   res.json({
     project
   })
  }else
  {
    res.json({
      success:false,
      message:"no project found"
    })
  }   
});

app.get("/projects",cors(), async (req,res)=>{
  
  var generatedProject = await getProjects();
  if (generatedProject != null)
  res.json(generatedProject)
  else
  res.json({
    success:false,
    message:"no projects available"
  })
})

app.put("/projects/edit/:id", cors(),async (req,res)=>{
  var title     = req.body.title;
  var description = req.body.description;
  var url   = req.body.url;
  var postsRef = db.collection('Project');
  var query = postsRef.where('projectid', '==', req.params.id).get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
          var updateDoc = db.collection('Project').doc(doc.id).update({
            title,
            description,
            url,
            }).then(() => {
              res.json({
                success:true,
                message:"successfully updated your document"
              })
            } 
            );
        });
      })
});
app.delete('/projects/delete/:id', async (req, res) => {
  var postsRef = db.collection('Project');
  var query = postsRef.where('projectid', '==', req.params.id).get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
          var deleteDoc = db.collection('Project').doc(doc.id).delete();
        });
      })
      res.json({
        success:true,
        message:"project successfully deleted"
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
});
app.post("/blogs", cors(),async (req,res)=>{
  var title     = req.body.title;
  var description = req.body.description;
  var url   = req.body.url;
  var blogid = req.body.blogid;
   var blogimg=req.body.blogimg; 
    var blog = {
        title: title,
        description: description,
        blogid: blogid,
        url: url,
        blogimg:blogimg
      };
      res.json({
        blog
      }) 
        await storeBlog(blog);
        return blog
})

app.get('/blogs/:id',cors(),async (req,res) =>{
  const snapshot = await db.collection("Blog").get();
  snapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
      blog=doc.data();
      blog['id']=doc.id
     
    })
 console.log(blog)
 if(blog){
  res.json({
    blog
  })
 }else
 {
   res.json({
     success:false,
     message:"no blog found"
   })
 }
   
});

app.get("/blogs", cors(),async (req,res)=>{
  var generatedBlog = await getBlogs();
  if (generatedBlog != null)
  res.json(generatedBlog)
  else
  res.json({
    success:false,
    message:"no blogs available"
  })
})

app.put("/blogs/edit/:id", cors(),async (req,res)=>{
  var title     = req.body.title;
  var description = req.body.description;
  var url   = req.body.url;
  var postsRef = db.collection('Blog');
  var query = postsRef.where('blogid', '==', req.params.id).get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
          var updateDoc = db.collection('Blog').doc(doc.id).update({
            title,
            description,
            url,
            }).then(() => {
              res.json({
                success:true,
                message:"successfully updated your document"
              })
            } 
            );
        });
      })
});

app.delete('/blogs/delete/:id', async (req, res) => {
  var postsRef = db.collection('Blog');
  var query = postsRef.where('blogid', '==', req.params.id).get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
          var deleteDoc = db.collection('Blog').doc(doc.id).delete();
        });
      })
      res.json({
        success:true,
        message:"blog successfully deleted"
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
});
// app.listen(5000, () => {
//   console.log("server is listening on port: 5000")
// })

app.listen(process.env.PORT || 5000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});


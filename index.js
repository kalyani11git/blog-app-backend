const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

require("dotenv").config();

const cloudinary = require("./config/CloudinaryConfig"); // Import Cloudinary
const { connectDB, Blog } = require("./config/db"); // Import MongoDB connection & Blog model

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB before starting the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Add Blog Route
app.post("/AddBlog", upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "user_profiles", resource_type: "image" },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary Upload Error:", error.message);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    console.log("✅ Image uploaded:", uploadResult.secure_url);

    // Create and save new blog post
    const newBlog = new Blog({
      title,
      image: uploadResult.secure_url,
      description,
    });

    await newBlog.save();
    res.status(201).json({ message: "Blog added successfully", blog: newBlog });
  } catch (error) {
    console.error("❌ Blog adding error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get All Blogs
app.get("/GetBlogs", async (req, res) => {
  try {
    const blogs = await Blog.find(); // Fetch all blogs
    res.status(200).json({ blogs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ DELETE Blog
app.delete("/DeleteBlog/:id", async (req, res) => {
  try {
    const blogId = req.params.id;
    const deletedBlog = await Blog.findByIdAndDelete(blogId);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ UPDATE Blog
app.put("/UpdateBlog/:id", upload.single("image"), async (req, res) => {
  try {
    const blogId = req.params.id;
    const { title, description } = req.body;
    let imageUrl = null;

    // If a new image is uploaded, update it on Cloudinary
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "user_profiles", resource_type: "image" },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary Upload Error:", error.message);
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    // Update the blog in the database
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title,
        description,
        ...(imageUrl && { image: imageUrl }), // Only update the image if a new one is uploaded
      },
      { new: true } // Return the updated document
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.get("/GetBlog/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.json({ blog });
});


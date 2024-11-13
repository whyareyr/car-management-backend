// // controllers/carController.js
// const Car = require("../models/Car.js");
// const cloudinary = require("../config/cloudinary.js");

// // Create new car
// exports.createCar = async (req, res) => {
//   const { title, description, tags } = req.body;
//   const images = [];

//   try {
//     if (req.files) {
//       for (let i = 0; i < req.files.length; i++) {
//         const result = await cloudinary.uploader.upload(req.files[i].path, {
//           folder: "car-images",
//         });
//         images.push(result.secure_url);
//       }
//     }

//     const car = new Car({
//       title,
//       description,
//       tags,
//       images,
//       user: req.user.id,
//     });
//     await car.save();

//     res.status(201).json(car);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get all cars of a user
// exports.getCars = async (req, res) => {
//   try {
//     const cars = await Car.find({ user: req.user.id });
//     res.status(200).json(cars);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update car
// exports.updateCar = async (req, res) => {
//   const { title, description, tags } = req.body;

//   try {
//     const car = await Car.findById(req.params.id);
//     if (!car) return res.status(404).json({ message: "Car not found" });

//     if (car.user.toString() !== req.user.id) {
//       return res.status(401).json({ message: "Not authorized" });
//     }

//     car.title = title || car.title;
//     car.description = description || car.description;
//     car.tags = tags || car.tags;
//     await car.save();

//     res.status(200).json(car);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Delete car
// exports.deleteCar = async (req, res) => {
//   try {
//     const car = await Car.findById(req.params.id);
//     if (!car) return res.status(404).json({ message: "Car not found" });

//     if (car.user.toString() !== req.user.id) {
//       return res.status(401).json({ message: "Not authorized" });
//     }

//     await car.remove();
//     res.status(200).json({ message: "Car removed" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// controllers/carController.js
const Car = require("../models/Car.js");
const cloudinary = require("../config/cloudinary.js");
const fs = require("fs");

// Utility function to delete a file from the server
const deleteFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) console.error(`Error deleting file at ${path}:`, err);
  });
};

// Create new car
exports.createCar = async (req, res) => {
  const { title, description, tags } = req.body;
  const images = [];

  try {
    if (req.files) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "car-images",
        });
        images.push(result.secure_url);
        deleteFile(file.path); // Delete the file from local storage after upload
      }
    }

    const car = new Car({
      title,
      description,
      tags,
      images,
      user: req.user.id,
    });
    await car.save();

    res.status(201).json(car);
  } catch (error) {
    // If an error occurs, delete any remaining local files
    if (req.files) {
      req.files.forEach((file) => deleteFile(file.path));
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all cars of a user
exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find({ user: req.user.id });
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update car
exports.updateCar = async (req, res) => {
  const { title, description, tags } = req.body;
  const updatedImages = [];

  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // Check if the user is authorized to update the car
    if (car.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update car details
    car.title = title || car.title;
    car.description = description || car.description;
    car.tags = tags || car.tags;

    // If new images are provided, upload them to Cloudinary
    if (req.files) {
      // First, delete the old images from Cloudinary
      for (let i = 0; i < car.images.length; i++) {
        const image = car.images[i];
        const publicId = image.split("/").pop().split(".")[0]; // Extract public ID from URL
        await cloudinary.uploader.destroy(publicId); // Delete the image from Cloudinary
      }

      // Upload new images to Cloudinary and store their URLs
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path, {
          folder: "car-images",
        });
        updatedImages.push(result.secure_url); // Push the secure URL to the images array
      }

      // Update the car's images field
      car.images = updatedImages;
    }

    // Save the updated car document
    await car.save();

    // Return the updated car
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete car
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    for (let i = 0; i < car.images.length; i++) {
      const image = car.images[i];

      // Extract the public ID from the URL to delete from Cloudinary
      const publicId = image.split("/").pop().split(".")[0]; // Get the public ID from the URL

      // Destroy image from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete the car from the database using findByIdAndDelete
    await Car.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Car removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

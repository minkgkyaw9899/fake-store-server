import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import multer from "multer";
import db from "./db/db.json" with {type: 'json'};
import createHttpError from "http-errors";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const responseFormatter = <T>(status: number, message: string, data?: T) => {
  return {
    meta: {
      status,
      message,
    },
    data: data || null,
  };
};

function getRandomRating(min = 1, max = 5) {
  const rating = Math.random() * (max - min) + min;
  return Math.round(rating * 10) / 10;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/");
  },
  filename: (req, file, cb) => {
    var dateTimestamp = Date.now();
    console.log("file", file);
    cb(
      null,
      file.fieldname +
        "-" +
        dateTimestamp +
        "." +
        file.originalname.split(".")[file.originalname.split(".").length - 1]
    );
  },
});

const upload = multer({
  storage,
});

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return next(createHttpError(401));

  const token = authHeader.split(" ")[1];

  if (!token) return next(createHttpError(401));

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).userId = payload.userId; // attach userId to request object
    next();
  } catch (err) {
    return next(createHttpError(401, "Invalid token"));
  }
};

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/public", express.static(path.join(__dirname, "public")));

// get all products
app.get("/api/products", authenticateJWT, (req, res) => {
  try {
    let { page = "1", limit = "10" } = req.query;

    let pageNumber = parseInt(page as string, 10);
    let limitNumber = parseInt(limit as string, 10);

    // validation
    if (isNaN(pageNumber) || pageNumber < 1) pageNumber = 1;
    if (isNaN(limitNumber) || limitNumber < 1) limitNumber = 10;

    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;

    const paginatedProducts = db.products.slice(startIndex, endIndex);

    const totalPages = Math.ceil(db.products.length / limitNumber);

    return res.status(200).json(
      responseFormatter(200, "Success", {
        page: pageNumber,
        limit: limitNumber,
        total: db.products.length,
        totalPages,
        products: paginatedProducts,
      })
    );
  } catch (err) {
    return res.status(500).json(responseFormatter(500, "Server error"));
  }
});

// create new product
app.post(
  "/api/products",
  authenticateJWT,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { title, price, description, category } = req.body;

      const imagePath = req.file ? req.file.path : null;

      console.log("imagePath", imagePath);

      const randomRate = getRandomRating();
      const randomCount = Math.floor(Math.random() * 300) + 1;
      const newProducts = {
        id: db.products ? db.products.length + 1 : 1,
        title,
        price: +price,
        description,
        category,
        image: imagePath ? `http://localhost:8000/${imagePath}` : "",
        rating: {
          rate: randomRate,
          count: randomCount,
        },
      };

      db.products.push(newProducts);

      const dbPath = path.join(__dirname, "./db/db.json");

      fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8", (err) => {
        if (err) return next(createHttpError(400));

        return res
          .status(201)
          .json(
            responseFormatter(
              201,
              "Successfully create a new products",
              newProducts
            )
          );
      });
    } catch (err) {
      return next(err);
    }
  }
);

// get products/ categories
app.get("/api/products/categories", authenticateJWT, (req, res, next) => {
  const categories = db.categories;

  return res.status(200).json(responseFormatter(200, "Success", categories));
});

// update product by id
app.patch(
  "/api/products/:id",
  authenticateJWT,
  upload.single("image"),
  (req, res, next) => {
    try {
      const id = req.params.id;

      if (!id) return next(createHttpError(400));

      const productIndex = db.products.findIndex((p) => p.id === +id);

      if (productIndex === -1)
        return next(createHttpError(404, "Product not found"));

      const { title, price, description, category } = req.body;
      const imagePath = req.file ? req.file.path : null;

      if (!db.products[productIndex]) return createHttpError(404);

      // update only provided fields
      if (title !== undefined) db.products[productIndex].title = title;
      if (price !== undefined) db.products[productIndex].price = +price;
      if (description !== undefined)
        db.products[productIndex].description = description;
      if (category !== undefined) db.products[productIndex].category = category;
      if (imagePath)
        db.products[productIndex].image = `http://localhost:8000/${imagePath}`;

      const dbPath = path.join(__dirname, "./db/db.json");
      fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8", (err) => {
        if (err) return next(createHttpError(500, "Failed to save product"));

        return res
          .status(200)
          .json(
            responseFormatter(
              200,
              "Product updated successfully",
              db.products[productIndex]
            )
          );
      });
    } catch (err) {
      next(err);
    }
  }
);

// delete product by id
app.delete("/api/products/:id", authenticateJWT, (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) return next(createHttpError(400));

    const productIndex = db.products.findIndex((p) => p.id === +id);

    if (productIndex === -1)
      return next(createHttpError(404, "Product not found"));

    // remove product from array
    const removedProduct = db.products.splice(productIndex, 1)[0];

    // save to db.json
    const dbPath = path.join(__dirname, "./db/db.json");
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8", (err) => {
      if (err) return next(createHttpError(500, "Failed to delete product"));

      return res
        .status(200)
        .json(
          responseFormatter(200, "Product deleted successfully", removedProduct)
        );
    });
  } catch (err) {
    next(err);
  }
});

// get product by id
app.get("/api/products/:id", authenticateJWT, (req, res, next) => {
  const id = req.params.id;

  if (!id) return next(createHttpError(400));

  const productById = db.products.find((product) => product.id === +id);

  if (!productById) return next(createHttpError(404, "Product not found"));
  return res
    .status(200)
    .json(responseFormatter(200, `Success product by id ${id}`, productById));
});

// get all users
app.get("/api/users", authenticateJWT, (req, res) => {
  const { page = "1", limit = "10" } = req.query;
  let pageNumber = parseInt(page as string, 10);
  let limitNumber = parseInt(limit as string, 10);

  if (isNaN(pageNumber) || pageNumber < 1) pageNumber = 1;
  if (isNaN(limitNumber) || limitNumber < 1) limitNumber = 10;

  const startIndex = (pageNumber - 1) * limitNumber;
  const endIndex = startIndex + limitNumber;

  const paginatedUsers = db.users.slice(startIndex, endIndex);
  const totalPages = Math.ceil(db.users.length / limitNumber);

  return res.status(200).json(
    responseFormatter(200, "Success", {
      page: pageNumber,
      limit: limitNumber,
      total: db.users.length,
      totalPages,
      data: paginatedUsers,
    })
  );
});

// create new user
app.post("/api/users", (req, res, next) => {
  try {
    const { email, username, password, phone, name, address } = req.body;

    const newUser = {
      id: db.users.length ? db.users.length + 1 : 1,
      email,
      username,
      password,
      phone,
      name,
      address,
    };

    db.users.push(newUser);

    const dbPath = path.join(__dirname, "./db/db.json");
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8", (err) => {
      if (err) return next(createHttpError(500, "Failed to save user"));

      return res
        .status(201)
        .json(responseFormatter(201, "User created", newUser));
    });
  } catch (err) {
    next(err);
  }
});

// update user by id
app.patch("/api/users/:id", authenticateJWT, (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return next(createHttpError(400));

    const index = db.users.findIndex((u) => u.id === +id);
    if (index === -1) return next(createHttpError(404, "User not found"));

    const user = db.users[index];

    const { email, username, password, phone, name, address } = req.body;

    if (!user) return createHttpError(404);

    if (email !== undefined) user.email = email;
    if (username !== undefined) user.username = username;
    if (password !== undefined) user.password = password;
    if (phone !== undefined) user.phone = phone;
    if (name !== undefined) user.name = { ...user.name, ...name };
    if (address !== undefined) user.address = { ...user.address, ...address };

    const dbPath = path.join(__dirname, "./db/db.json");
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8", (err) => {
      if (err) return next(createHttpError(500, "Failed to update user"));
      return res.status(200).json(responseFormatter(200, "User updated", user));
    });
  } catch (err) {
    next(err);
  }
});

// delete user by id
app.delete("/api/users/:id", authenticateJWT, (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) return next(createHttpError(400));
    const index = db.users.findIndex((u) => u.id === +id);
    if (index === -1) return next(createHttpError(404, "User not found"));

    const removedUser = db.users.splice(index, 1)[0];

    const dbPath = path.join(__dirname, "./db/db.json");
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8", (err) => {
      if (err) return next(createHttpError(500, "Failed to delete user"));
      return res
        .status(200)
        .json(responseFormatter(200, "User deleted", removedUser));
    });
  } catch (err) {
    next(err);
  }
});

// get user by id
app.get("/api/users/:id", authenticateJWT, (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(createHttpError(400));

  const user = db.users.find((u) => u.id === +id);
  if (!user) return next(createHttpError(404, "User not found"));
  return res
    .status(200)
    .json(responseFormatter(200, `Success user by id ${id}`, user));
});

const JWT_SECRET = "superSecretK3y";
// login user
app.post("/api/auth/login", (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return next(createHttpError(400, "Email and password required"));

    const user = db.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return next(createHttpError(401, "Invalid email or password"));

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    return res.status(200).json(
      responseFormatter(200, "Login successful", {
        token,
        userId: user.id,
      })
    );
  } catch (err) {
    next(err);
  }
});

app.use((req: Request, res: Response, next: NextFunction) => {
  return next(createHttpError(404));
});

app.use(((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  return res.status(status).json({
    meta: {
      status,
      message,
    },
    data: null,
  });
}) as ErrorRequestHandler);

app.listen(8000, () => console.log("Server listening on 8000"));

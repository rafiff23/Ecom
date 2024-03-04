// index.js

const express = require("express");
const session = require("express-session");
const { Sequelize, DataTypes, or } = require("sequelize");
const bcrypt = require("bcrypt");
const routes = express.Router();
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const { Product } = require("./models");
const { User } = require("./models");
const { Cart } = require("./models");
const { Order } = require("./models");
const { userInfo } = require("os");
const { log } = require("console");


const env = process.env.NODE_ENV || "development";
const sequelize = new Sequelize(require("./config/config.json")[env]);

// const User = sequelize.define("User", {
//   username: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   email: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   role: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
// });

const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

const checkLogin = (req, res, next) => {
  // Periksa apakah status login ada di sesi
  if (req.session && req.session.isLoggedIn) {
    next(); // Lanjutkan jika pengguna sudah login
  } else {
    res.redirect("/login"); // Redirect ke halaman login jika pengguna tidak login
  }
};
app.use("/dashboard", checkLogin);
app.use("/produk", checkLogin);
app.use("/produk_home", checkLogin);
app.use("/keranjang", checkLogin);
app.use("/history", checkLogin);
app.use("/produk_tambah", checkLogin);
app.use("/produk_edit", checkLogin);
app.use("/delete-product", checkLogin);
app.use("/akun", checkLogin);
app.use("/akun", checkLogin);

app.get("/", (req, res) => {
  const user = req.session.user;
  res.render("index", { user: user });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/detail_produk/:id", async (req, res) => {
  const user = req.session.user;
  const productId=req.params.id;
  const product = await Product.findByPk(productId);
  const rupiah = (number)=>{
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR"
    }).format(number);
  }
  console.log(product)
  res.render("detail_produk",{user:user,product,rupiah})
});

app.get("/akun",async (req, res) => {
  const user = req.session.user;
  try {
    const Akun = await User.findAll();
    res.render("akun", { Akun, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/profile", async (req, res) => {
  const user = req.session.user;

  try {
    if (!user) {
      // Redirect to the login page if the user is not logged in
      return res.redirect("/login");
    }

    // Fetch the user account data for the logged-in user
    const loggedInUser = await User.findOne({
      where: {
        username: user.username // Adjust this based on your actual model attributes
      }
    });

    if (!loggedInUser) {
      // Handle the case where the user data is not found
      console.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    res.render("profile", { akun: loggedInUser, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/dashboard", (req, res) => {
  const user = req.session.user;
  res.render("dashboard", { user: user });
});

app.get("/produk", async (req, res) => {
  const user = req.session.user;
  try {
    const product = await Product.findAll();
    res.render("produk", { product, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/produk_home", async (req, res) => {
  const user = req.session.user;
  try {
    const rupiah = (number)=>{
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
      }).format(number);
    }
    const products = await Product.findAll();
    res.render("produk_home", { products, user: user,rupiah });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/keranjang", async (req, res) => {
  try {
    // Mendapatkan ID pengguna dari sesi
    const userId = req.session.user ? req.session.user.id : null;
    const rupiah = (number)=>{
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
      }).format(number);
    }

    // Memastikan pengguna sudah login
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Mengambil data keranjang berdasarkan userId
    const keranjang = await Cart.findAll({ where: { userId } });

    // Mengirim data ke tampilan
    res.render("keranjang", { keranjang, user: req.session.user,rupiah });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/history", async (req, res) => {
  try {
    // Mendapatkan ID pengguna dari sesi
    const userId = req.session.user ? req.session.user.id : null;
    const rupiah = (number)=>{
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
      }).format(number);
    }

    // Memastikan pengguna sudah login
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Mengambil data keranjang berdasarkan userId
    const history = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']], // Menambahkan opsi order berdasarkan createdAt secara descending
    });

    // Mengirim data ke tampilan
    res.render("history", { history, user: req.session.user,rupiah });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/produk_tambah", (req, res) => {
  const user = req.session.user;
  res.render("produk_tambah", { user: user });
});

app.get('/detail_history', async (req, res) => {
  try {
    const user=req.session.user
    const createdAt = req.query.createdAt;
    const productId = req.query.productId;
    const rupiah = (number)=>{
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
      }).format(number);
    }
  

    // Lakukan logika untuk mengambil data detail berdasarkan tanggal
    const detailData = await Order.findAll({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: createdAt,
        },
        id: productId,
        userId: user.id,
      },
    });

    // Render halaman detail dengan data yang diambil
    res.render('detail_history', { detailData, createdAt,user:user,rupiah });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/edit-product/:Id", async (req, res) => {
  try {
    const user = req.session.user;
    const productId = req.params.Id;
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    res.render("produk_edit", { product, user: user });
  } catch (error) {
    console.error("Error fetching product for editing:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.get("/edit-akun/:Id", async (req, res) => {
  try {
    const user = req.session.user;
    const akunId = req.params.Id;
    const akun = await User.findByPk(akunId);
    console.log(akun)

    if (!akun) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    res.render("akun_edit", { akun, user: user });
  } catch (error) {
    console.error("Error fetching product for editing:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/loginaksi", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });

    if (user) {
      // Periksa kesesuaian password (disarankan menggunakan bcrypt.compare)

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        if (user.role === "admin") {
          // Pengguna adalah admin, lakukan sesuatu untuk admin
          return res.redirect("dashboard");
        } else {
          // Pengguna adalah pengguna biasa, lakukan sesuatu untuk pengguna biasa
          return res.redirect("/");
        }
      } else {
        const errorMessage ="Username dan Password Salah";
        res.render('login',{errorMessage})
      }
    } else {
      const errorMessage ="Username dan Password Salah";
      res.render('login',{errorMessage})
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/register_aksi", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Cek apakah username sudah terdaftar
    const existingUser = await User.findOne({ where: { username, email } });

    if (existingUser) {
      const errorMessage =
        "Username already exists. Please choose another username.";
      return res.render("signup", { error: errorMessage });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      email,
    });
    const successMessage = "Register Berhasil Silahkan Login.";
    res.render("signup", { success: successMessage });
    //   setTimeout(() => {
    //     return res.redirect('/login');
    //   }, 2000);

    //   res.send(`User ${newUser.username} registered successfully. Role: ${newUser.role}`);
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads"); // Simpan gambar di folder uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Ubah nama gambar menjadi timestamp + ekstensi
  },
});

const upload = multer({ storage });

app.post("/produk_tambah", upload.single("productImage"), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const productImage = req.file ? `/uploads/${req.file.filename}` : null;

    const newProduct = await Product.create({
      name,
      description,
      price,
      image: productImage,
    });
    //   res.status(201).json(newProduct);
    res.redirect("produk");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/tambah-keranjang', async (req, res) => {
  try {
    const { productId,productname,productprice,productjumlah,productimage } = req.body;
    console.log(req.body.productjumlah)
    console.log(req.body.productId)
    const user = req.session.user;
    const rupiah = (number)=>{
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
      }).format(number);
    }

    
    // Pastikan productId dan quantity telah diterima dengan benar
    if (!productId || !productjumlah) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    const userId = req.session.user.id;
    console.log("Userid",userId)
    // Cek apakah produk sudah ada di keranjang
    const existingCartItem = await Cart.findOne({ where: { productId,userId } });
    console.log(existingCartItem)

    if (existingCartItem) {
      // Jika produk sudah ada, tambahkan ke jumlah yang ada
      existingCartItem.quantity= existingCartItem.quantity + 1;
      await existingCartItem.save();
     } 
     else {
      // Jika produk belum ada, tambahkan sebagai item baru di keranjang
      await Cart.create({ userId:userId,productId:productId,quantity:productjumlah,name:productname,price:productprice,image:productimage });
      
    }
    const successMessage = 'Product added to cart successfully';
    const products = await Product.findAll();
    return res.render("produk_home",{user:user,products,successMessage,rupiah})
    // return res.status(201).json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/checkout', async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Ambil semua item dari tabel Keranjang untuk pengguna tertentu
    const keranjangItems = await Cart.findAll({ where: { userId } });

    // Mulai transaksi
    const transaction = await sequelize.transaction();

    try {
      // Loop melalui setiap item di Keranjang dan tambahkan ke Checkout
      for (const item of keranjangItems) {
        await Order.create(
          {
            userId: userId,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            status:"success"
          },
          { transaction }
        );
      }

      // Hapus semua item di Keranjang
      await Cart.destroy({ where: { userId } }, { transaction });

      // Commit transaksi
      await transaction.commit();

      // Redirect atau kirim respons sesuai kebutuhan aplikasi
      return res.redirect('/history');
    } catch (error) {
      // Rollback transaksi jika terjadi kesalahan
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error selama proses checkout:', error);
    return res.status(500).json({ error: 'Kesalahan internal server selama proses checkout.' });
  }
});

app.post("/edit-produk/:id",
  upload.single("productImage"),
  async (req, res) => {
    try {
      const user = req.session.user;
      const productId = req.params.id;
      const { name, description, price } = req.body;
      const { oldImage } = req.body; // Ambil nilai gambar lama
      const productImage = req.file ? `/uploads/${req.file.filename}` : null;

      const products = await Product.findByPk(productId);

      if (!products) {
        return res
          .status(404)
          .render("error", { message: "Product not found" });
      }

      // Update informasi produk
      products.name = name;
      products.description = description;
      products.price = price;
      products.image = productImage;

      // Tangani gambar baru

      // Simpan perubahan ke dalam database
      await products.save();
      const product = await Product.findAll();
      console.log("berhasil");
      res.render("produk", { product, user: user }); // Redirect ke halaman produk setelah perubahan disimpan
    } catch (error) {
      console.error("Error editing product:", error);
      res.status(500).render("error", { message: "Internal Server Error" });
    }
  }
);


app.post("/edit-akun/:Id", async (req, res) => {
  try {
    const akunId = req.params.Id;
    const { username, email, password, role } = req.body;
    console.log(req.body)

    // Fetch the user to edit
    const akun = await User.findByPk(akunId);

    if (!akun) {
      return res.status(404).render("error", { message: "User account not found" });
    }

    // Update user data
    akun.username = username;
    akun.email = email;
    
    // Check if a new password is provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      akun.password = hashedPassword;
    }

    akun.role = role;

    // Save the updated user data to the database
    await akun.save();

    // Redirect to a success page or the edited user profile page
    res.redirect('/akun');
  } catch (error) {
    console.error("Error editing user account:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.post("/edit-profile/:Id", async (req, res) => {
  try {
    const user=req.session.user
    const akunId = req.params.Id;
    const { username, email, password, role } = req.body;
    console.log(req.body)

    // Fetch the user to edit
    const akun = await User.findByPk(akunId);

    if (!akun) {
      return res.status(404).render("error", { message: "User account not found" });
    }

    // Update user data
    akun.username = username;
    akun.email = email;
    
    // Check if a new password is provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      akun.password = hashedPassword;
    }

    akun.role = "biasa";

    // Save the updated user data to the database
    await akun.save();
    const successMessage = 'Data Berhasil Di Edit';
    // Redirect to a success page or the edited user profile page
    res.render('profile',{successMessage,akun, user:user})
  } catch (error) {
    console.error("Error editing user account:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.get("/delete-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Hapus produk dari database berdasarkan ID
    const deletedProduct = await Product.destroy({
      where: { id: productId },
    });

    if (deletedProduct) {
      // Jika produk berhasil dihapus, redirect ke halaman produk
      res.redirect("/produk");
    } else {
      // Jika produk tidak ditemukan, tampilkan pesan kesalahan
      res.status(404).render("error", { message: "Product not found" });
    }
  } catch (error) {
    // Tangani kesalahan
    console.error("Error deleting product:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});
app.get("/delete-akun/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Hapus produk dari database berdasarkan ID
    const deletedakun = await User.destroy({
      where: { id: userId },
    });

    if (deletedakun) {
      // Jika produk berhasil dihapus, redirect ke halaman produk
      res.redirect("/akun");
    } else {
      // Jika produk tidak ditemukan, tampilkan pesan kesalahan
      res.status(404).render("error", { message: "Product not found" });
    }
  } catch (error) {
    // Tangani kesalahan
    console.error("Error deleting product:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});
app.get("/delete-keranjang/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Hapus produk dari database berdasarkan ID
    const deletedkeranjang = await Cart.destroy({
      where: { id: productId },
    });

    if (deletedkeranjang) {
      // Jika produk berhasil dihapus, redirect ke halaman produk
      res.redirect("/keranjang");
    } else {
      // Jika produk tidak ditemukan, tampilkan pesan kesalahan
      res.status(404).render("error", { message: "Product not found" });
    }
  } catch (error) {
    // Tangani kesalahan
    console.error("Error deleting product:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

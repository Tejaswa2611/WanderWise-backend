require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport =require('passport');
const session = require('express-session');
const cors=require('cors');
const ExpenseRouter = require('./routes/ExpenseRouter.js');
const ensureAuthenticated = require('./middlewares/Auth.js');
const dbConnect = require('./config/dbConnect.js');
const currencyRoutes = require('./routes/currencyRoutes');
const weatherRoutes=require('./routes/WeatherRoute.js')
const activitiesRoute=require('./routes/activitiesRoute.js')
const locationRoutes=require('./routes/locationRoute.js')
const http = require('http');
const { exec } = require("child_process");
const axios= require('axios');
const amadeusRoutes=require('./routes/amadeus.js')
const tmdbRoutes=require('./routes/tmdb.js')
const dotenv = require('dotenv');
dotenv.config();

const AuthRouter = require('./routes/authRoutes.js'); 
const subscriberRoutes = require('./routes/subscriberRoutes.js');
const cityRoutes=require('./routes/cityRoutes.js')
const shareLoc= require('./routes/locationRoutes.js')
const newsletterJob = require('./utils/cronJob');
const storyRoute= require('./routes/stories.js')
require('./models/db.js');

// Socket.IO and MongoDB models
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`
  }
});

// Middleware
app.use(bodyParser.json());
// app.use(cors());
app.set('trust proxy', 1); 
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

app.options('*', cors());
const cron = require('node-cron'); 
const geminiRoutes = require('./routes/geminiRoutes');
const movieRoutes = require("./routes/movieRoutes");



let importGtfs;
let getStops;

// Immediately-invoked async function to load GTFS
(async () => {
  try {
    const gtfsModule = await import('gtfs');
    // Correctly extract methods from ES module
    importGtfs = gtfsModule.importGtfs;
    getStops = gtfsModule.getStops;

    const gtfsConfig = require('./config/gtfs-config.json');
    
    // Initialize GTFS data
    const refreshGTFSData = async () => {
      try {
        await importGtfs(gtfsConfig);
        console.log('GTFS data refreshed successfully');
      } catch (error) {
        console.error('GTFS import failed:', error);
      }
    };

    // Initial refresh
    await refreshGTFSData();

    // Schedule daily refresh
    cron.schedule('0 3 * * *', () => {
      console.log('Running daily GTFS data refresh');
      refreshGTFSData();
    });

  } catch (error) {
    console.error('Failed to initialize GTFS:', error);
  }
})();



require('./config/passportConfig.js');


require('dotenv').config();
// require('./Models/db');
dbConnect();
const PORT=process.env.PORT||5000

app.get('/ping',(req,res)=>{
    res.send('PONG');
})
// Logging middleware
app.use((req, res, next) => {
         console.log("Session:", req.session);
  console.log("User:", req.user);
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});
//middleware
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(bodyParser.json());
const corsOptions = {
    origin: true,//process.env.FRONTEND_URL || 'http://localhost:3000', // frontend origin
    credentials: true,
  };
  
  app.use(cors(corsOptions));
  
app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized:false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
  
})
);
app.use(passport.initialize());
app.use(passport.session());
//routes

app.use('/auth',AuthRouter);
app.use('/expenses',ExpenseRouter)
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/weather', weatherRoutes);
// Use the activitiesRoute for handling activity-related requests
app.use('/api/activities', activitiesRoute); // Prefix all routes with /api
app.use('/api', locationRoutes);

const wheelchairRoute = require('./routes/gtfs'); // path may vary
app.use('/api', wheelchairRoute);

app.get('/api/stops', async (req, res) => {
    try {
      if (!getStops) throw new Error('GTFS not initialized');
  
      const accessibleStops = await getStops({ wheelchair_boarding: 1 });
      const allStops = await getStops();
  
      console.log(`Accessible Stops: ${accessibleStops.length}`);
      console.log(`Total Stops: ${allStops.length}`);
  
      res.json({ accessibleStops, totalStops: allStops.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch stops: ' + error.message });
    }
  });
  app.use('/api/gemini', geminiRoutes);
  app.use("/api/movies", movieRoutes);
  
  
// Routes
app.get('/ping', (req, res) => res.send('PONG'));
app.use('/auth', AuthRouter);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/locations', shareLoc);

// Cron job
newsletterJob.start();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gtfs.db');

db.all('SELECT stop_id, stop_name, wheelchair_boarding FROM stops LIMIT 10', [], (err, rows) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log(rows);
});

db.close();

const NodeCache = require("node-cache");

const trendCache = new NodeCache({ stdTTL: 3600 }); 

// Trends route
app.get("/trends", (req, res) => {
    const { cityA, cityB } = req.query;

    if (!cityA || !cityB) {
        return res.status(400).json({ error: "Please provide two cities." });
    }

    const cacheKey = `${cityA.toLowerCase()}_${cityB.toLowerCase()}`;
    const cachedData = trendCache.get(cacheKey);

    if (cachedData) {
        console.log("✅ Returning cached data");
        return res.json(cachedData);
    }

    const command = `python trends.py "${cityA}" "${cityB}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Google Trends API Error:", stderr);
            return res.status(500).json({ error: "Failed to fetch trends." });
        }

        try {
            const data = JSON.parse(stdout);
            trendCache.set(cacheKey, data); // Save result to cache
            console.log("📡 New data fetched & cached");
            res.json(data);
        } catch (parseError) {
            console.error("⚠️ JSON Parsing Error:", parseError.message);
            res.status(500).json({ error: "Invalid JSON response from Python script." });
        }
    });
});

const rooms = {};

// ========== SOCKET.IO ========== //
io.on('connection', (socket) => {
  console.log(`🔌 New socket connected: ${socket.id}`);

  socket.on('createRoom', ({ meetupName, username }) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      name: meetupName,
      members: {},
    };
    rooms[roomId].members[socket.id] = { 
      socketId: socket.id, 
      username: username || `User-${socket.id.slice(0, 4)}`,
      location: null 
    };

    socket.join(roomId);

    socket.emit('roomCreated', { roomId, meetupName });
    io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
  });

  socket.on('joinRoom', ({ roomId, username }) => {
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Room not found!' });
      return;
    }

    rooms[roomId].members[socket.id] = { 
      socketId: socket.id, 
      username: username || `User-${socket.id.slice(0, 4)}`,
      location: null 
    };

    socket.join(roomId);

    socket.emit('roomJoined', {
      roomId,
      meetupName: rooms[roomId].name,
    });
    io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
    io.to(roomId).emit('userJoined', { 
      username: rooms[roomId].members[socket.id].username 
    });
  });

  socket.on('updateLocation', ({ roomId, location }) => {
    if (rooms[roomId]?.members[socket.id]) {
      rooms[roomId].members[socket.id].location = location;
      io.to(roomId).emit('locationUpdate', Object.values(rooms[roomId].members));
    }
  });

  socket.on('leaveRoom', ({ roomId }) => {
    if (rooms[roomId]?.members[socket.id]) {
      const username = rooms[roomId].members[socket.id].username;
      delete rooms[roomId].members[socket.id];
      socket.leave(roomId);
      io.to(roomId).emit('userLeft', { username });

      if (Object.keys(rooms[roomId].members).length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`X Socket disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      if (rooms[roomId].members[socket.id]) {
        const username = rooms[roomId].members[socket.id].username;
        delete rooms[roomId].members[socket.id];
        io.to(roomId).emit('userLeft', { username });

        if (Object.keys(rooms[roomId].members).length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('roomUpdate', Object.values(rooms[roomId].members));
        }
      }
    }
  });
});

// ======= ROOM ID GENERATOR ======= //
function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

app.use('/api/cities', cityRoutes);
app.use('/api/stories',storyRoute);
app.use('/api', amadeusRoutes);
app.use('/api', tmdbRoutes);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

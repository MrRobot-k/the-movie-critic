const User = require('./models/user.model')(sequelize);
const Rating = require('./models/rating.model')(sequelize);
const Like = require('./models/like.model')(sequelize);
const Watchlist = require('./models/watchlist.model')(sequelize);

// Define associations
User.hasMany(Rating, { foreignKey: 'userId' });
Rating.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Watchlist, { foreignKey: 'userId' });
Watchlist.belongsTo(User, { foreignKey: 'userId' });

const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testDbConnection();

// Middleware para autenticar el token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403); // Token no válido

    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    res.status(200).json({ message: 'Inicio de sesión exitoso', token, user: { id: user.id, username: user.username, email: user.email } });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para calificar una película
app.post('/api/movies/:movieId/rate', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { score } = req.body;
    const userId = req.user.id; // ID del usuario autenticado

    // Validar la puntuación
    if (score < 0.5 || score > 5) {
      return res.status(400).json({ error: 'La puntuación debe estar entre 0.5 y 5.' });
    }

    // Buscar si el usuario ya calificó esta película
    let rating = await Rating.findOne({ where: { userId, movieId } });

    if (rating) {
      // Si ya existe, actualizar la calificación
      rating.score = score;
      await rating.save();
      res.status(200).json({ message: 'Calificación actualizada exitosamente.', rating });
    } else {
      // Si no existe, crear una nueva calificación
      rating = await Rating.create({ userId, movieId, score });
      res.status(201).json({ message: 'Calificación guardada exitosamente.', rating });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener la calificación de un usuario para una película
app.get('/api/movies/:movieId/rating', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const rating = await Rating.findOne({ where: { userId, movieId } });

    if (rating) {
      res.status(200).json({ rating });
    } else {
      res.status(404).json({ message: 'Calificación no encontrada para este usuario y película.' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener todas las películas calificadas por el usuario autenticado
app.get('/api/users/watched', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const watchedMovies = await Rating.findAll({ where: { userId }, attributes: ['movieId', 'score'] });
    res.status(200).json({ watchedMovies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para dar o quitar 'Me gusta' a una película
app.post('/api/movies/:movieId/like', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    let like = await Like.findOne({ where: { userId, movieId } });

    if (like) {
      // Si ya existe, eliminar el 'Me gusta'
      await like.destroy();
      res.status(200).json({ message: 'Me gusta eliminado exitosamente.', liked: false });
    } else {
      // Si no existe, crear un nuevo 'Me gusta'
      like = await Like.create({ userId, movieId });
      res.status(201).json({ message: 'Me gusta añadido exitosamente.', liked: true });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener todas las películas a las que el usuario le ha dado 'Me gusta'
app.get('/api/users/likes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const likedMovies = await Like.findAll({ where: { userId }, attributes: ['movieId'] });
    res.status(200).json({ likedMovies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar si el usuario le ha dado 'Me gusta' a una película
app.get('/api/movies/:movieId/likeStatus', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const like = await Like.findOne({ where: { userId, movieId } });

    res.status(200).json({ isLiked: !!like });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Watchlist Endpoints ---

// Endpoint para añadir o quitar una película de la watchlist
app.post('/api/movies/:movieId/watchlist', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    let watchlistItem = await Watchlist.findOne({ where: { userId, movieId } });

    if (watchlistItem) {
      // Si ya existe, eliminar de la watchlist
      await watchlistItem.destroy();
      res.status(200).json({ message: 'Película eliminada de la watchlist.', watchlisted: false });
    } else {
      // Si no existe, añadir a la watchlist
      watchlistItem = await Watchlist.create({ userId, movieId });
      res.status(201).json({ message: 'Película añadida a la watchlist.', watchlisted: true });
    }

  } catch (error) {
    console.error('Error in /api/movies/:movieId/watchlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener el estado de watchlist de una película para un usuario
app.get('/api/movies/:movieId/watchlistStatus', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOne({ where: { userId, movieId } });

    res.status(200).json({ isWatchlisted: !!watchlistItem });

  } catch (error) {
    console.error('Error in /api/movies/:movieId/watchlistStatus:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener todas las películas en la watchlist del usuario autenticado
app.get('/api/users/watchlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const watchlistedMovies = await Watchlist.findAll({ where: { userId }, attributes: ['movieId'] });
    res.status(200).json({ watchlistedMovies });
  } catch (error) {
    console.error('Error in /api/users/watchlist:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
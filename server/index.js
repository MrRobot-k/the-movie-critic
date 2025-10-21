const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;
const multer = require('multer');
const path = require('path');

// Configuración de Multer para la subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Las imágenes se guardarán en la carpeta 'uploads/'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Nombre único para cada archivo
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir archivos estáticos desde la carpeta uploads

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: process.env.DB_PORT,
});
const User = require('./models/user.model')(sequelize);
const Rating = require('./models/rating.model')(sequelize);
const Like = require('./models/like.model')(sequelize);
const Watchlist = require('./models/watchlist.model')(sequelize);
const Review = require('./models/review.model')(sequelize);
const List = require('./models/list.model')(sequelize);
const ListItem = require('./models/listItem.model')(sequelize);
const TopMovie = require('./models/topMovie.model')(sequelize);
const TopDirector = require('./models/topDirector.model')(sequelize);
const UserTopActors = require('./models/userTopActors.model')(sequelize);

// Define associations
User.hasMany(Rating, { foreignKey: 'userId' });
Rating.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserTopActors, { foreignKey: 'userId' });
UserTopActors.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(TopMovie, { foreignKey: 'userId' });
TopMovie.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(TopDirector, { foreignKey: 'userId' });
TopDirector.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Watchlist, { foreignKey: 'userId' });
Watchlist.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(List, { foreignKey: 'userId' });
List.belongsTo(User, { foreignKey: 'userId' });

List.hasMany(ListItem, { foreignKey: 'listId', as: 'items' });
ListItem.belongsTo(List, { foreignKey: 'listId' });

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

    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: 'Credenciales inválidas' });

    // Generar JWT
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    res.status(200).json({ message: 'Inicio de sesión exitoso', token, user: { id: user.id, username: user.username, email: user.email } });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para actualizar la foto de perfil del usuario
app.put('/api/users/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicturePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!profilePicturePath) return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen.' });

    const user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    user.profilePicture = profilePicturePath;
    await user.save();

    res.status(200).json({ message: 'Foto de perfil actualizada exitosamente.', profilePicture: user.profilePicture });

  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para calificar una película
app.post('/api/media/:mediaId/rate', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { score, mediaType } = req.body;
    const userId = req.user.id;

    if (!mediaType) return res.status(400).json({ error: 'El tipo de medio es requerido.' });

    if (score < 0.5 || score > 5) return res.status(400).json({ error: 'La puntuación debe estar entre 0.5 y 5.' });

    let rating = await Rating.findOne({ where: { userId, mediaId, mediaType } });

    if (rating) {
      rating.score = score;
      await rating.save();
      res.status(200).json({ message: 'Calificación actualizada exitosamente.', rating });
    } else {
      rating = await Rating.create({ userId, mediaId, mediaType, score });
      res.status(201).json({ message: 'Calificación guardada exitosamente.', rating });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener la calificación de un usuario para un medio
app.get('/api/media/:mediaId/rating', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.query;
    const userId = req.user.id;

    const rating = await Rating.findOne({ where: { userId, mediaId, mediaType } });

    if (rating) res.status(200).json({ rating });
    else res.status(404).json({ message: 'Calificación no encontrada.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Endpoint para obtener todas las películas calificadas por el usuario autenticado
app.get('/api/users/watched', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { count, rows } = await Rating.findAndCountAll({
      where: { userId },
      attributes: ['mediaId', 'mediaType', 'score'],
    });

    res.status(200).json({ watchedMovies: rows, totalPages: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/media/:mediaId/like', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.body;
    const userId = req.user.id;

    if (!mediaType) return res.status(400).json({ error: 'El tipo de medio es requerido.' });

    let like = await Like.findOne({ where: { userId, mediaId, mediaType } });

    if (like) {
      await like.destroy();
      res.status(200).json({ message: 'Me gusta eliminado exitosamente.', liked: false });
    } else {
      like = await Like.create({ userId, mediaId, mediaType });
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

    const { count, rows } = await Like.findAndCountAll({
      where: { userId },
      attributes: ['mediaId', 'mediaType'],
    });

    res.status(200).json({ likedItems: rows, totalPages: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar si el usuario le ha dado 'Me gusta' a una película/serie
app.get('/api/media/:mediaId/likeStatus', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.query;
    const userId = req.user.id;

    const like = await Like.findOne({ where: { userId, mediaId, mediaType } });

    res.status(200).json({ isLiked: !!like });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaId/watchedStatus', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.query;
    const userId = req.user.id;

    const watchedItem = await Rating.findOne({ where: { userId, mediaId, mediaType } });

    res.status(200).json({ isWatched: !!watchedItem });

  } catch (error) {
    console.error('Error in /api/media/:mediaId/watchedStatus:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Watchlist Endpoints ---
// Endpoint para añadir o quitar una película de la watchlist
app.post('/api/media/:mediaId/watchlist', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.body;
    const userId = req.user.id;

    if (!mediaType) return res.status(400).json({ error: 'El tipo de medio es requerido.' });

    let watchlistItem = await Watchlist.findOne({ where: { userId, mediaId, mediaType } });

    if (watchlistItem) {
      await watchlistItem.destroy();
      res.status(200).json({ message: 'Película eliminada de la watchlist.', watchlisted: false });
    } else {
      watchlistItem = await Watchlist.create({ userId, mediaId, mediaType });
      res.status(201).json({ message: 'Película añadida a la watchlist.', watchlisted: true });
    }

  } catch (error) {
    console.error('Error in /api/media/:mediaId/watchlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener el estado de watchlist de una película para un usuario
app.get('/api/media/:mediaId/watchlistStatus', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.query;
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOne({ where: { userId, mediaId, mediaType } });

    res.status(200).json({ isWatchlisted: !!watchlistItem });

  } catch (error) {
    console.error('Error in /api/media/:mediaId/watchlistStatus:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener todas las películas en la watchlist del usuario autenticado
app.get('/api/users/watchlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { count, rows } = await Watchlist.findAndCountAll({
      where: { userId },
      attributes: ['mediaId', 'mediaType'],
    });

    res.status(200).json({ watchlistedMovies: rows, totalPages: 1 });
  } catch (error) {
    console.error('Error in /api/users/watchlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Review Endpoints ---
// Endpoint para crear o actualizar una review
app.post('/api/media/:mediaId/review', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType, reviewText } = req.body;
    const userId = req.user.id;

    if (!mediaType) return res.status(400).json({ error: 'El tipo de medio es requerido.' });

    if (!reviewText || reviewText.trim().length === 0) return res.status(400).json({ error: 'El texto del review es requerido.' });

    let review = await Review.findOne({ where: { userId, mediaId, mediaType } });

    if (review) {
      review.reviewText = reviewText.trim();
      await review.save();
      res.status(200).json({ message: 'Review actualizado exitosamente.', review });
    } else {
      review = await Review.create({ userId, mediaId, mediaType, reviewText: reviewText.trim() });
      res.status(201).json({ message: 'Review creado exitosamente.', review });
    }

  } catch (error) {
    console.error('Error in /api/media/:mediaId/review:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener el review del usuario autenticado para un medio
app.get('/api/media/:mediaId/myReview', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.query;
    const userId = req.user.id;

    const review = await Review.findOne({ where: { userId, mediaId, mediaType } });

    if (review) res.status(200).json({ review });
    else res.status(404).json({ message: 'Review no encontrado.' });

  } catch (error) {
    console.error('Error in /api/media/:mediaId/myReview:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener todas las reviews de un medio (con información del usuario)
app.get('/api/media/:mediaId/reviews', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.query;

    if (!mediaType) return res.status(400).json({ error: 'El tipo de medio es requerido.' });

    const reviews = await Review.findAll({
      where: { mediaId, mediaType },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Obtener ratings y likes para cada review
    const reviewsWithDetails = await Promise.all(reviews.map(async (review) => {
      const rating = await Rating.findOne({
        where: { userId: review.userId, mediaId, mediaType },
        attributes: ['score']
      });

      const like = await Like.findOne({
        where: { userId: review.userId, mediaId, mediaType }
      });

      return {
        id: review.id,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        user: {
          id: review.User.id,
          username: review.User.username,
        },
        rating: rating ? rating.score : null,
        hasLiked: !!like,
      };
    }));

    res.status(200).json({ reviews: reviewsWithDetails });

  } catch (error) {
    console.error('Error in /api/media/:mediaId/reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para eliminar un review
app.delete('/api/media/:mediaId/review', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { mediaType } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ where: { userId, mediaId, mediaType } });

    if (review) {
      await review.destroy();
      res.status(200).json({ message: 'Review eliminado exitosamente.' });
    } else res.status(404).json({ message: 'Review no encontrado.' });

  } catch (error) {
    console.error('Error in /api/media/:mediaId/review DELETE:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- List Endpoints ---

// Crear una nueva lista
app.post('/api/lists', authenticateToken, async (req, res) => {
  try {
    const { name, description, isNumbered, items } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'El nombre de la lista es requerido.' });

    // Crear la lista
    const list = await List.create({
      userId,
      name: name.trim(),
      description: description?.trim() || '',
      isNumbered: isNumbered || false,
      isPublic: true,
    });

    // Agregar items a la lista si existen
    if (items && Array.isArray(items) && items.length > 0) {
      const listItems = items.map((item, index) => ({
        listId: list.id,
        mediaId: item.mediaId,
        mediaType: item.mediaType,
        order: index + 1,
      }));
      await ListItem.bulkCreate(listItems);
    }

    res.status(201).json({ message: 'Lista creada exitosamente.', list });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las listas del usuario
app.get('/api/users/lists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const lists = await List.findAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture'],
        },
        {
          model: ListItem,
          as: 'items',
          attributes: ['mediaId', 'mediaType', 'order'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ lists });
  } catch (error) {
    console.error('Error fetching user lists:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener una lista específica (pública)
app.get('/api/lists/:listId', async (req, res) => {
  try {
    const { listId } = req.params;

    const list = await List.findOne({
      where: { id: listId, isPublic: true },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture'],
        },
        {
          model: ListItem,
          as: 'items',
          attributes: ['mediaId', 'mediaType', 'order'],
        },
      ],
    });

    if (!list) return res.status(404).json({ error: 'Lista no encontrada.' });

    res.status(200).json({ list });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar una lista
app.put('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, description, isNumbered, items } = req.body;
    const userId = req.user.id;

    const list = await List.findOne({ where: { id: listId, userId } });

    if (!list) return res.status(404).json({ error: 'Lista no encontrada.' });

    // Actualizar la lista
    list.name = name?.trim() || list.name;
    list.description = description?.trim() || list.description;
    list.isNumbered = isNumbered !== undefined ? isNumbered : list.isNumbered;
    await list.save();

    // Si hay items, actualizar los items
    if (items && Array.isArray(items)) {
      // Eliminar items existentes
      await ListItem.destroy({ where: { listId: list.id } });

      // Crear nuevos items
      if (items.length > 0) {
        const listItems = items.map((item, index) => ({
          listId: list.id,
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          order: index + 1,
        }));
        await ListItem.bulkCreate(listItems);
      }
    }

    res.status(200).json({ message: 'Lista actualizada exitosamente.', list });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una lista
app.delete('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    const list = await List.findOne({ where: { id: listId, userId } });

    if (!list) return res.status(404).json({ error: 'Lista no encontrada.' });

    await list.destroy();
    res.status(200).json({ message: 'Lista eliminada exitosamente.' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las listas públicas (para explorar)
app.get('/api/lists', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await List.findAndCountAll({
      where: { isPublic: true },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture'],
        },
        {
          model: ListItem,
          as: 'items',
          attributes: ['mediaId', 'mediaType', 'order'],
          limit: 4, // Solo primeras 4 películas para preview
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      lists: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching public lists:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Top Movies Endpoints ---
// Endpoint para agregar/actualizar las Top 10 Películas de un usuario
app.post('/api/users/top-movies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topMovies } = req.body; // topMovies es un array de { mediaId, mediaType, order }

    if (!Array.isArray(topMovies) || topMovies.length > 10) return res.status(400).json({ error: 'Se requiere un array de hasta 10 películas.' });

    // Eliminar las películas existentes del top del usuario
    await TopMovie.destroy({ where: { userId } });

    // Crear nuevas entradas para las Top 10 Películas
    const newTopMovies = topMovies.map(movie => ({
      userId,
      mediaId: movie.mediaId,
      mediaType: movie.mediaType,
      order: movie.order,
    }));
    await TopMovie.bulkCreate(newTopMovies);

    res.status(200).json({ message: 'Top 10 Películas actualizado exitosamente.' });
  } catch (error) {
    console.error('Error updating top movies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener las Top 10 Películas de un usuario
app.get('/api/users/top-movies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const topMovies = await TopMovie.findAll({
      where: { userId },
      order: [['order', 'ASC']],
    });
    res.status(200).json({ topMovies });
  } catch (error) {
    console.error('Error fetching top movies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para eliminar una película del Top 10 de un usuario
app.delete('/api/users/top-movies/:mediaId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mediaId } = req.params;

    const deleted = await TopMovie.destroy({
      where: { userId, mediaId },
    });

    if (deleted) res.status(200).json({ message: 'Película eliminada del Top 10 exitosamente.' });
    else res.status(404).json({ error: 'Película no encontrada en el Top 10.' });
  } catch (error) {
    console.error('Error deleting top movie:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Top Directors Endpoints ---

// Endpoint para agregar/actualizar los Top 10 Directores de un usuario
app.post('/api/users/top-directors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topDirectors } = req.body; // topDirectors es un array de { personId, order }

    if (!Array.isArray(topDirectors) || topDirectors.length > 10) return res.status(400).json({ error: 'Se requiere un array de hasta 10 directores.' });

    // Eliminar los directores existentes del top del usuario
    await TopDirector.destroy({ where: { userId } });

    // Crear nuevas entradas para los Top 10 Directores
    const newTopDirectors = topDirectors.map(director => ({
      userId,
      personId: director.personId,
      order: director.order,
    }));
    await TopDirector.bulkCreate(newTopDirectors);

    res.status(200).json({ message: 'Top 10 Directores actualizado exitosamente.' });
  } catch (error) {
    console.error('Error updating top directors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener los Top 10 Directores de un usuario
app.get('/api/users/top-directors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const topDirectors = await TopDirector.findAll({
      where: { userId },
      order: [['order', 'ASC']],
    });
    res.status(200).json({ topDirectors });
  } catch (error) {
    console.error('Error fetching top directors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para eliminar un director del Top 10 de un usuario
app.delete('/api/users/top-directors/:personId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { personId } = req.params;

    const deleted = await TopDirector.destroy({
      where: { userId, personId },
    });

    if (deleted) res.status(200).json({ message: 'Director eliminado del Top 10 exitosamente.' });
    else res.status(404).json({ error: 'Director no encontrado en el Top 10.' });
  } catch (error) {
    console.error('Error deleting top director:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Top Actors Endpoints ---
// Endpoint para agregar/actualizar los Top 10 Actores de un usuario
app.post('/api/user/top-actors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { actors } = req.body; // actors es un array de { actorId, name, profile_path, character, order }

    if (!Array.isArray(actors) || actors.length > 10) return res.status(400).json({ error: 'Se requiere un array de hasta 10 actores.' });

    // Eliminar los actores existentes del top del usuario
    await UserTopActors.destroy({ where: { userId } });

    // Crear nuevas entradas para los Top 10 Actores
    const newUserTopActors = actors.map(actor => ({
      userId,
      actorId: actor.id,
      name: actor.name,
      profile_path: actor.profile_path,
      character: actor.character,
      order: actor.order,
    }));
    await UserTopActors.bulkCreate(newUserTopActors);

    res.status(200).json({ message: 'Top 10 Actores actualizado exitosamente.' });
  } catch (error) {
    console.error('Error updating top actors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener los Top 10 Actores de un usuario
app.get('/api/user/top-actors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const topActors = await UserTopActors.findAll({
      where: { userId },
      order: [['order', 'ASC']],
    });
    res.status(200).json(topActors);
  } catch (error) {
    console.error('Error fetching top actors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para eliminar un actor del Top 10 de un usuario
app.delete('/api/user/top-actors/:actorId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { actorId } = req.params;

    const deleted = await UserTopActors.destroy({
      where: { userId, actorId },
    });

    if (deleted) res.status(200).json({ message: 'Actor eliminado del Top 10 exitosamente.' });
    else res.status(404).json({ error: 'Actor no encontrado en el Top 10.' });
  } catch (error) {
    console.error('Error deleting top actor:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'profilePicture'],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

const { sequelize, User, Category, Expense } = require('./models');

const app = express();

/* APP CONFIG*/

// View engine
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use((req, res, next) => {
  res.locals.user = null;
  res.locals.error = null;
  next();
});

/* JWT AUTH MIDDLEWARE*/

const authenticate = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) return res.redirect('/login');

    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

/* AUTH ROUTES*/

// Signup
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.send('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('Signup error');
  }
});

// Login
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.send('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Invalid credentials');

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false // true in production (HTTPS)
    });

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Login error');
  }
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

/*DASHBOARD*/

app.get('/', authenticate, async (req, res) => {
  const expenses = await Expense.findAll({
    where: { UserId: req.user.id },
    include: Category
  });

  res.render('index', {
    title: 'Dashboard',
    expenses
  });
});

/* CATEGORIES*/

app.get('/categories', authenticate, async (req, res) => {
  const categories = await Category.findAll();

  res.render('categories', {
    title: 'Categories',
    categories
  });
});

/* EXPENSES*/

// List expenses
app.get('/expenses', authenticate, async (req, res) => {
  const expenses = await Expense.findAll({
    where: { UserId: req.user.id },
    include: Category,
    order: [['date', 'DESC']]
  });

  res.render('expenses', {
    title: 'Expenses',
    expenses
  });
});

// New expense form
app.get('/expenses/new', authenticate, async (req, res) => {
  const categories = await Category.findAll();

  res.render('expense-form', {
    title: 'Add Expense',
    expense: null,
    categories,
    action: '/expenses'
  });
});

// Create expense
app.post('/expenses', authenticate, async (req, res) => {
  try {
    const { title, amount, date, categoryId } = req.body;

    await Expense.create({
      title,
      amount,
      date,
      CategoryId: categoryId,
      UserId: req.user.id
    });

    res.redirect('/expenses');
  } catch (err) {
    console.error(err);
    res.send('Error creating expense');
  }
});

// Delete Expense 
app.post('/expenses/:id/delete', authenticate, async (req, res) => {
  try {
    await Expense.destroy({
      where: {
        id: req.params.id,
        UserId: req.user.id  // Assuming your authenticate middleware sets req.user
      }
    });
    res.redirect('/expenses');
  } catch (err) {
    console.error(err);
    res.send('Error deleting expense');
  }
});



/* SERVER*/

(async () => {
  try {
    await sequelize.sync();
    console.log('Database synced');

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
    });
  } catch (err) {
    console.error('DB sync error', err);
  }
})();

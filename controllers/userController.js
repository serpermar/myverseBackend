const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// La clave secreta para los JWT, se recomienda usar una variable de entorno.
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// Función para registrar un nuevo usuario
exports.registrarUsuario = async (req, res) => {
  const { nombre, email, contraseña } = req.body;

  if (!nombre || !email || !contraseña) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar si el email ya existe en la base de datos
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Insertar el nuevo usuario en la base de datos
    await pool.query(
      'INSERT INTO usuarios (nombre, email, contraseña) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Función para que un usuario inicie sesión
exports.loginUsuario = async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    // Buscar al usuario por su email
    const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const usuario = users[0];
    // Comparar la contraseña ingresada con la encriptada en la base de datos
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!contraseñaValida) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Si las credenciales son correctas, generar un token JWT
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};
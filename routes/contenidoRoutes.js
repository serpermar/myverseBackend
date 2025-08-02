const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middlewares/auth');

// Agregar contenido manualmente con más campos
router.post('/crear', auth, async (req, res) => {
  const { titulo, tipo, año, imagen_url, descripcion } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO contenidos (titulo, tipo, año, imagen_url, descripcion) VALUES (?, ?, ?, ?, ?)',
      [titulo, tipo, año, imagen_url, descripcion]
    );
    res.status(201).json({ id: result.insertId, titulo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear contenido' });
  }
});

// Usuario marca contenido como visto, leído, etc.
router.post('/marcar', auth, async (req, res) => {
  const { contenido_id, estado, puntuacion, reseña, recomendar } = req.body;
  const usuario_id = req.usuario.id;

  try {
    const [existente] = await pool.query(
      'SELECT id FROM estados_usuario WHERE usuario_id = ? AND contenido_id = ?',
      [usuario_id, contenido_id]
    );

    if (existente.length > 0) {
      await pool.query(
        `UPDATE estados_usuario
         SET estado = ?, puntuacion = ?, reseña = ?, recomendar = ?
         WHERE usuario_id = ? AND contenido_id = ?`,
        [estado, puntuacion || null, reseña || null, recomendar, usuario_id, contenido_id]
      );
      res.json({ mensaje: 'Estado actualizado' });
    } else {
      await pool.query(
        `INSERT INTO estados_usuario
         (usuario_id, contenido_id, estado, puntuacion, reseña, recomendar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuario_id, contenido_id, estado, puntuacion || null, reseña || null, recomendar]
      );
      res.status(201).json({ mensaje: 'Estado creado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar estado' });
  }
});

// Ver lista del usuario
router.get('/mis-contenidos', auth, async (req, res) => {
  const usuario_id = req.usuario.id;
  try {
    const [filas] = await pool.query(
      `SELECT c.id AS contenido_id, c.titulo, c.tipo, c.imagen_url, eu.estado, eu.puntuacion, eu.reseña, eu.recomendar
       FROM estados_usuario eu
       JOIN contenidos c ON eu.contenido_id = c.id
       WHERE eu.usuario_id = ?`,
      [usuario_id]
    );
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la lista del usuario' });
  }
});

// Listar todos los contenidos disponibles
router.get('/contenidos', auth, async (req, res) => {
  try {
    const [filas] = await pool.query('SELECT * FROM contenidos');
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener contenidos' });
  }
});

// Obtener detalles de un contenido específico
router.get('/contenidos/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const [filas] = await pool.query('SELECT * FROM contenidos WHERE id = ?', [id]);
    if (filas.length > 0) {
      res.json(filas[0]);
    } else {
      res.status(404).json({ error: 'Contenido no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el detalle del contenido' });
  }
});

// Obtener estado de un contenido para el usuario actual
router.get('/estado/:id', auth, async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;
  try {
    const [filas] = await pool.query(
      'SELECT estado, puntuacion, reseña, recomendar FROM estados_usuario WHERE usuario_id = ? AND contenido_id = ?',
      [usuario_id, id]
    );
    if (filas.length > 0) {
      res.json(filas[0]);
    } else {
      res.json({}); // Devolver objeto vacío si no hay estado
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el estado del contenido' });
  }
});

module.exports = router;
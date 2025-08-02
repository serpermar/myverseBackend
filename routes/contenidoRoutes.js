const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middlewares/auth');

// Agregar contenido manualmente
router.post('/crear', auth, async (req, res) => {
  const { titulo, tipo, año } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO contenidos (titulo, tipo, año) VALUES (?, ?, ?)',
      [titulo, tipo, año]
    );
    res.status(201).json({ id: result.insertId, titulo });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear contenido' });
  }
});

// Usuario marca contenido como visto, leído, etc.
router.post('/marcar', auth, async (req, res) => {
    const { contenido_id, estado, puntuacion, reseña, fecha_terminado, recomendar } = req.body;
    const usuario_id = req.usuario.id;
  
    try {
      // Verificar si ya existe el registro para actualizar, si no insertar
      const [existing] = await pool.query(
        'SELECT id FROM estados_usuario WHERE usuario_id = ? AND contenido_id = ?',
        [usuario_id, contenido_id]
      );
  
      if (existing.length > 0) {
        // Actualizar registro existente
        await pool.query(
          `UPDATE estados_usuario
           SET estado = ?, puntuacion = ?, reseña = ?, fecha_terminado = ?, recomendar = ?, fecha_actualizacion = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [estado, puntuacion || null, reseña || null, fecha_terminado || null, recomendar || 0, existing[0].id]
        );
        res.json({ mensaje: 'Estado actualizado' });
      } else {
        // Insertar nuevo registro
        await pool.query(
          `INSERT INTO estados_usuario (usuario_id, contenido_id, estado, puntuacion, reseña, fecha_terminado, recomendar)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [usuario_id, contenido_id, estado, puntuacion || null, reseña || null, fecha_terminado || null, recomendar || 0]
        );
        res.status(201).json({ mensaje: 'Estado creado' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al marcar contenido' });
    }
  });

// Ver lista del usuario
router.get('/mis-contenidos', auth, async (req, res) => {
  const usuario_id = req.usuario.id;
  try {
    const [rows] = await pool.query(
      `SELECT c.titulo, c.tipo, eu.estado, eu.puntuacion, eu.reseña, eu.fecha_actualizacion, eu.fecha_terminado, eu.recomendar
       FROM estados_usuario eu
       JOIN contenidos c ON eu.contenido_id = c.id
       WHERE eu.usuario_id = ?`,
      [usuario_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lista' });
  }
});

module.exports = router;

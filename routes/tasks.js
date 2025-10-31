// routes/tasks.js

const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    let query = Task.find(JSON.parse(req.query.where || '{}'));

    if (req.query.sort) query = query.sort(JSON.parse(req.query.sort));
    if (req.query.select) query = query.select(JSON.parse(req.query.select));
    if (req.query.skip) query = query.skip(parseInt(req.query.skip));
    if (req.query.limit) query = query.limit(parseInt(req.query.limit || 100)); // default 100

    const result = req.query.count === 'true'
      ? await query.countDocuments()
      : await query;

    res.status(200).json({ message: 'OK', data: result });
  } catch (err) {
    res.status(400).json({ message: err.message, data: [] });
  }
});

// POST new task
router.post('/', async (req, res) => {
  try {
    const { name, deadline } = req.body;
    if (!name || !deadline)
      return res.status(400).json({ message: 'Missing name or deadline', data: {} });

    const newTask = new Task(req.body);
    const saved = await newTask.save();

    if (req.body.assignedUser) {
      await User.findByIdAndUpdate(req.body.assignedUser, {
        $push: { pendingTasks: saved._id }
      });
    }

    res.status(201).json({ message: 'Task created', data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message, data: {} });
  }
});

// GET task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found', data: {} });

    res.status(200).json({ message: 'OK', data: task });
  } catch (err) {
    res.status(400).json({ message: err.message, data: {} });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated)
      return res.status(404).json({ message: 'Task not found', data: {} });

    // Maintain user-task consistency
    if (req.body.assignedUser) {
      await User.findByIdAndUpdate(req.body.assignedUser, {
        $addToSet: { pendingTasks: updated._id }
      });
    }

    res.status(200).json({ message: 'Task updated', data: updated });
  } catch (err) {
    res.status(400).json({ message: err.message, data: {} });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: 'Task not found', data: {} });

    if (deleted.assignedUser) {
      await User.findByIdAndUpdate(deleted.assignedUser, {
        $pull: { pendingTasks: deleted._id }
      });
    }

    res.status(204).json({ message: 'Task deleted', data: {} });
  } catch (err) {
    res.status(400).json({ message: err.message, data: {} });
  }
});

module.exports = router;

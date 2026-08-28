const settingsModel = require('../models/settingsModel');

const getSettings = async (req, res) => {
  try {
    const settings = await settingsModel.getSettings(req.user.id);
    res.json(settings);
  } catch (err) {
    console.error('Errore getSettings:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

const updateSettings = async (req, res) => {
  const { subjects, categories } = req.body;

  if (!Array.isArray(subjects) || !Array.isArray(categories)) {
    return res.status(400).json({ error: 'subjects e categories devono essere array.' });
  }

  try {
    const settings = await settingsModel.updateSettings(
      req.user.id,
      subjects,
      categories
    );
    res.json(settings);
  } catch (err) {
    console.error('Errore updateSettings:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

module.exports = { getSettings, updateSettings };
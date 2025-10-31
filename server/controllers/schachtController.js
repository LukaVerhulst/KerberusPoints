import Schacht from '../models/Schacht.js';
import TaskCompletion from '../models/TaskCompletion.js';

// Get all Schachten sorted by points
export const getSchachten = async (req, res)=> {
    try {
        const schatchen = await Schacht.find().sort({ points: -1 }).lean();
        res.status(200).json(schatchen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add new Schacht
export const addSchacht = async (req, res) => {
    try {
        const { name } = req.body;
        const schacht = await Schacht.create({ name });
        res.status(201).json(schacht);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE schacht with completions
export const deleteSchacht = async (req, res) => {
  try {
    const { id } = req.params;

    const schacht = await Schacht.findByIdAndDelete(id);
    if (!schacht) return res.status(404).json({ message: 'Schacht niet gevonden' });

    // Delete all task completions for this schacht
    await TaskCompletion.deleteMany({ schachtId: id });

    res.status(200).json({ message: 'Schacht and completions deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update schacht points
export const updatePoints = async (req, res) => {
    try {
        const { id } = req.params;
        const { points } = req.body;
        
        const schacht = await Schacht.findByIdAndUpdate(
            id,
            { points },
            { new: true }
        );
        
        if (!schacht) {
            return res.status(404).json({ message: 'Schacht niet gevonden' });
        }
        
        res.status(200).json(schacht);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
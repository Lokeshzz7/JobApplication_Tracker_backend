// routes/jobRoutes.js
import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobsByUserPreferences,
  getRecommendedJobs,
  searchJobsFromAPI,
  getCompanyInsights,
  getSalaryData
} from '../controllers/job.controller.js';
import { requireAuth } from '../middlewares/auth.js'; // Assuming you have auth middleware

const router = express.Router();

router.use(requireAuth);



// Job CRUD operations
router.post('/', createJob); // Create new job
router.put('/:id', updateJob); // Update job
router.delete('/:id', deleteJob); // Delete job

// Public routes (no authentication required)
router.get('/', getAllJobs); // Get all jobs with filters
router.get('/search-api', searchJobsFromAPI); // Search jobs from external API
router.get('/:id', getJobById); // Get specific job by ID
router.get('/company/:companyName/insights', getCompanyInsights); // Get company insights
router.get('/salary-data/info', getSalaryData); // Get salary data




// User preference-based routes
router.get('/user/preferences', getJobsByUserPreferences); // Get jobs based on user preferences
router.get('/user/recommendations', getRecommendedJobs); // Get recommended jobs

export default router;
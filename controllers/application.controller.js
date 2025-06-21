import Application from '../models/Application.js';
import User from '../models/User.js';

// Create a new job application
export const createApplication = async (req, res) => {
  try {
    const userId = req.user.id; 
    const applicationData = req.body;

    // Create the application
    const application = new Application({
      ...applicationData,
      appliedAt: new Date()
    });

    // Add initial status to status history
    application.statusHistory.push({
      status: application.currentStatus,
      updatedAt: new Date(),
      updatedBy: userId,
      note: 'Application created'
    });

    await application.save();

    // Add application reference to user
    await User.findByIdAndUpdate(
      userId,
      { $push: { applications: application._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error.message
    });
  }
};

// Get all applications for a user
export const getUserApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, company, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.currentStatus = status;
    if (company) filter.company = { $regex: company, $options: 'i' };

    
    const user = await User.findById(userId).populate({
      path: 'applications',
      match: filter,
      options: {
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.applications,
      count: user.applications.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Get single application by ID
export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Not found'
      });
    }

    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const { status, note } = req.body;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    
    application.currentStatus = status;
    application.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: userId,
      note: note || `Status updated to ${status}`
    });
    application.updatedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// Update application details
export const updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const updateData = req.body;
    const userId = req.user.id;

    // Verify user owns this application
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.statusHistory;
    delete updateData.createdAt;
    
    updateData.updatedAt = new Date();

    const application = await Application.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

  
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findByIdAndDelete(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    
    await User.findByIdAndUpdate(
      userId,
      { $pull: { applications: applicationId } }
    );

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
};

// Add communication record
export const addCommunication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const { mode, summary, contactPerson } = req.body;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.communications.push({
      date: new Date(),
      mode,
      summary,
      contactPerson
    });
    application.updatedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Communication record added successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding communication record',
      error: error.message
    });
  }
};

// Add notes to application
export const  addNotes = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const { notes } = req.body;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { 
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notes updated successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notes',
      error: error.message
    });
  }
};


//Reminder Handling
export const addReminder = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const { type, dueDate, note } = req.body;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.reminders.push({
      type,
      dueDate: new Date(dueDate),
      note,
      isCompleted: false
    });
    application.updatedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Reminder added successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding reminder',
      error: error.message
    });
  }
};


export const getUserReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { completed, upcoming, overdue } = req.query;

    const user = await User.findById(userId).populate('applications');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let allReminders = [];
    const currentDate = new Date();

    
    user.applications.forEach(app => {
      app.reminders.forEach(reminder => {
        allReminders.push({
          ...reminder.toObject(),
          applicationId: app._id,
          jobTitle: app.jobTitle,
          company: app.company
        });
      });
    });

    
    if (completed === 'true') {
      allReminders = allReminders.filter(r => r.isCompleted);
    } else if (completed === 'false') {
      allReminders = allReminders.filter(r => !r.isCompleted);
    }

    if (upcoming === 'true') {
      allReminders = allReminders.filter(r => 
        !r.isCompleted && new Date(r.dueDate) > currentDate
      );
    }

    if (overdue === 'true') {
      allReminders = allReminders.filter(r => 
        !r.isCompleted && new Date(r.dueDate) < currentDate
      );
    }

    
    allReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({
      success: true,
      data: allReminders,
      count: allReminders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reminders',
      error: error.message
    });
  }
};

// Update reminder completion status
export const updateReminderStatus = async (req, res) => {
  try {
    const { applicationId, reminderId } = req.body;
    const { isCompleted } = req.body;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const reminder = application.reminders.id(reminderId);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminder.isCompleted = isCompleted;
    application.updatedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Reminder status updated successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating reminder status',
      error: error.message
    });
  }
};

// Delete reminder
export const deleteReminder = async (req, res) => {
  try {
    const { applicationId, reminderId } = req.params;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.reminders.pull(reminderId);
    application.updatedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting reminder',
      error: error.message
    });
  }
};


export const getUpcomingReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const daysAhead = parseInt(req.query.days) || 7;

    const user = await User.findById(userId).populate('applications');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + daysAhead);

    let upcomingReminders = [];

    user.applications.forEach(app => {
      app.reminders.forEach(reminder => {
        const reminderDate = new Date(reminder.dueDate);
        if (!reminder.isCompleted && 
            reminderDate >= currentDate && 
            reminderDate <= futureDate) {
          upcomingReminders.push({
            ...reminder.toObject(),
            applicationId: app._id,
            jobTitle: app.jobTitle,
            company: app.company
          });
        }
      });
    });

    // Sort by due date
    upcomingReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({
      success: true,
      data: upcomingReminders,
      count: upcomingReminders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming reminders',
      error: error.message
    });
  }
};


export const getApplicationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'all' } = req.query; // all, week, month, year

    const user = await User.findById(userId).populate('applications');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let applications = user.applications;
    const currentDate = new Date();

    // Filter applications based on period
    if (period !== 'all') {
      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(currentDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(currentDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(currentDate.getFullYear() - 1);
          break;
      }
      applications = applications.filter(app => 
        new Date(app.createdAt) >= startDate
      );
    }

    // Calculate statistics
    const totalApplications = applications.length;
    const statusCounts = {
      applied: 0,
      'under review': 0,
      'interview scheduled': 0,
      offered: 0,
      rejected: 0
    };

    const companyCounts = {};
    const monthlyStats = {};
    
    applications.forEach(app => {
      // Count by status
      statusCounts[app.currentStatus] = (statusCounts[app.currentStatus] || 0) + 1;
      
      // Count by company
      companyCounts[app.company] = (companyCounts[app.company] || 0) + 1;
      
      // Monthly statistics
      const month = new Date(app.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    });

    // Calculate success metrics
    const interviewRate = totalApplications > 0 
      ? ((statusCounts['interview scheduled'] + statusCounts.offered) / totalApplications * 100).toFixed(2)
      : 0;
    
    const offerRate = totalApplications > 0 
      ? (statusCounts.offered / totalApplications * 100).toFixed(2)
      : 0;

    // Top companies applied to
    const topCompanies = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([company, count]) => ({ company, count }));

    // Monthly timeline
    const timeline = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const stats = {
      totalApplications,
      statusBreakdown: statusCounts,
      interviewRate: parseFloat(interviewRate),
      offerRate: parseFloat(offerRate),
      topCompanies,
      timeline,
      period
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics',
      error: error.message
    });
  }
};

// Get application timeline for a specific application
export const getApplicationTimeline = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user.applications.includes(applicationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this application'
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Create timeline combining status history and communications
    const timeline = [];

    // Add status history to timeline
    application.statusHistory.forEach(status => {
      timeline.push({
        type: 'status_change',
        date: status.updatedAt,
        title: `Status changed to: ${status.status}`,
        description: status.note,
        updatedBy: status.updatedBy
      });
    });

    // Add communications to timeline
    application.communications.forEach(comm => {
      timeline.push({
        type: 'communication',
        date: comm.date,
        title: `Communication via ${comm.mode}`,
        description: comm.summary,
        contactPerson: comm.contactPerson
      });
    });

    // Add reminders to timeline
    application.reminders.forEach(reminder => {
      timeline.push({
        type: 'reminder',
        date: reminder.dueDate,
        title: `${reminder.type} reminder`,
        description: reminder.note,
        isCompleted: reminder.isCompleted,
        isPast: new Date(reminder.dueDate) < new Date()
      });
    });

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        application: {
          jobTitle: application.jobTitle,
          company: application.company,
          currentStatus: application.currentStatus
        },
        timeline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application timeline',
      error: error.message
    });
  }
};

// Get dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('applications');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentDate = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(currentDate.getDate() - 7);

    // Recent applications (last 7 days)
    const recentApplications = user.applications.filter(app => 
      new Date(app.createdAt) >= weekAgo
    );

    // Active applications (not rejected or offered)
    const activeApplications = user.applications.filter(app => 
      !['rejected', 'offered'].includes(app.currentStatus)
    );

    // Upcoming reminders (next 7 days)
    const upcomingReminders = [];
    const nextWeek = new Date();
    nextWeek.setDate(currentDate.getDate() + 7);

    user.applications.forEach(app => {
      app.reminders.forEach(reminder => {
        const reminderDate = new Date(reminder.dueDate);
        if (!reminder.isCompleted && 
            reminderDate >= currentDate && 
            reminderDate <= nextWeek) {
          upcomingReminders.push({
            ...reminder.toObject(),
            applicationId: app._id,
            jobTitle: app.jobTitle,
            company: app.company
          });
        }
      });
    });

    // Overdue reminders
    const overdueReminders = [];
    user.applications.forEach(app => {
      app.reminders.forEach(reminder => {
        const reminderDate = new Date(reminder.dueDate);
        if (!reminder.isCompleted && reminderDate < currentDate) {
          overdueReminders.push({
            ...reminder.toObject(),
            applicationId: app._id,
            jobTitle: app.jobTitle,
            company: app.company
          });
        }
      });
    });

    // Interview scheduled count
    const interviewsScheduled = user.applications.filter(app => 
      app.currentStatus === 'interview scheduled'
    ).length;

    // Weekly goal progress
    const weeklyGoal = user.jobGoals.weeklyTarget;
    const currentWeekCount = user.jobGoals.currentWeekCount;
    const goalProgress = weeklyGoal > 0 ? (currentWeekCount / weeklyGoal * 100) : 0;

    const summary = {
      totalApplications: user.applications.length,
      activeApplications: activeApplications.length,
      recentApplications: recentApplications.length,
      interviewsScheduled,
      upcomingReminders: upcomingReminders.length,
      overdueReminders: overdueReminders.length,
      weeklyGoal: {
        target: weeklyGoal,
        current: currentWeekCount,
        progress: Math.round(goalProgress)
      },
      upcomingRemindersList: upcomingReminders.slice(0, 5), // Show top 5
      overdueRemindersList: overdueReminders.slice(0, 5) // Show top 5
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};
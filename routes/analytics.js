const express = require('express');
const router = express.Router();
const { getAnalyticsStats, analyticsData } = require('../middlewares/analytics');

// Protected route - add your authentication middleware
router.get('/stats', (req, res) => {
  try {
    const stats = getAnalyticsStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent visits
router.get('/recent-visits', (req, res) => {
  try {
    const recentVisits = analyticsData.pageViews
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);
    
    res.json({
      success: true,
      data: recentVisits
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get hourly/daily stats
router.get('/time-stats', (req, res) => {
  try {
    const now = new Date();
    const hourlyData = {};
    const dailyData = {};
    
    // Group by hour for last 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.getHours();
      const hourStart = new Date(hour.setMinutes(0, 0, 0));
      const hourEnd = new Date(hour.setMinutes(59, 59, 999));
      
      const visitsInHour = analyticsData.pageViews.filter(view => {
        const viewTime = new Date(view.timestamp);
        return viewTime >= hourStart && viewTime <= hourEnd;
      });
      
      hourlyData[hourKey] = {
        visits: visitsInHour.length,
        unique: new Set(visitsInHour.map(v => v.visitorId)).size
      };
    }
    
    // Group by day for last 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = day.toISOString().split('T')[0];
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const visitsInDay = analyticsData.pageViews.filter(view => {
        const viewTime = new Date(view.timestamp);
        return viewTime >= dayStart && viewTime <= dayEnd;
      });
      
      dailyData[dayKey] = {
        visits: visitsInDay.length,
        unique: new Set(visitsInDay.map(v => v.visitorId)).size
      };
    }
    
    res.json({
      success: true,
      data: { hourly: hourlyData, daily: dailyData }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
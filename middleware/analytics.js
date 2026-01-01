const geoip = require('geoip-lite');
const UserAgent = require('user-agent');

const analyticsData = {
  totalVisits: 0,
  uniqueVisitors: new Set(),
  pageViews: [],
  sessions: {},
  realtimeUsers: new Set(),
  lastHourVisits: [],
  dailyStats: {}
};

// Generate a unique visitor ID
const getVisitorId = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  return `${ip}-${userAgent}`.replace(/\s+/g, '');
};

const trackVisit = (req) => {
  const visitorId = getVisitorId(req);
  const timestamp = new Date();
  const url = req.originalUrl;
  const referrer = req.headers.referer || 'direct';
  const userAgent = req.headers['user-agent'] || '';
  
  // Parse user agent
  const parsedUA = new UserAgent(userAgent);
  
  // Get location from IP (in production, use a paid service like MaxMind)
  const ip = req.ip || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  
  const visitData = {
    timestamp,
    visitorId,
    url,
    referrer,
    device: parsedUA.device.type || 'desktop',
    browser: parsedUA.browser.name,
    os: parsedUA.os.name,
    country: geo ? geo.country : 'Unknown',
    city: geo ? geo.city : 'Unknown'
  };
  
  // Update analytics data
  analyticsData.totalVisits++;
  analyticsData.uniqueVisitors.add(visitorId);
  analyticsData.pageViews.push(visitData);
  
  // Clean old data (keep last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  analyticsData.pageViews = analyticsData.pageViews.filter(
    view => new Date(view.timestamp) > oneDayAgo
  );
  
  // Update realtime users (active in last 5 minutes)
  analyticsData.realtimeUsers.add(visitorId);
  
  // Clean up old realtime users
  analyticsData.realtimeUsers.forEach(id => {
    const userLastVisit = analyticsData.pageViews
      .filter(v => v.visitorId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (userLastVisit && (Date.now() - new Date(userLastVisit.timestamp)) > 5 * 60 * 1000) {
      analyticsData.realtimeUsers.delete(id);
    }
  });
  
  return visitData;
};

const analyticsMiddleware = (req, res, next) => {
  // Skip tracking for admin routes or API calls
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/_next')) {
    return next();
  }
  
  // Track the visit
  const visitData = trackVisit(req);
  
  // Attach tracking data to request
  req.analyticsData = visitData;
  
  next();
};

// Get analytics statistics
const getAnalyticsStats = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lastHourVisits = analyticsData.pageViews.filter(
    view => new Date(view.timestamp) > oneHourAgo
  );
  
  const todayVisits = analyticsData.pageViews.filter(
    view => new Date(view.timestamp) > todayStart
  );
  
  const uniqueToday = new Set(
    todayVisits.map(visit => visit.visitorId)
  ).size;
  
  const popularPages = analyticsData.pageViews.reduce((acc, view) => {
    acc[view.url] = (acc[view.url] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalVisits: analyticsData.totalVisits,
    uniqueVisitors: analyticsData.uniqueVisitors.size,
    realtimeUsers: analyticsData.realtimeUsers.size,
    lastHourVisits: lastHourVisits.length,
    todayVisits: todayVisits.length,
    todayUniqueVisitors: uniqueToday,
    popularPages: Object.entries(popularPages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, count })),
    trafficSources: analyticsData.pageViews.reduce((acc, view) => {
      const source = view.referrer.includes('google') ? 'Google' :
                     view.referrer.includes('facebook') ? 'Facebook' :
                     view.referrer === 'direct' ? 'Direct' : 'Other';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}),
    devices: analyticsData.pageViews.reduce((acc, view) => {
      acc[view.device] = (acc[view.device] || 0) + 1;
      return acc;
    }, {})
  };
};

module.exports = {
  analyticsMiddleware,
  getAnalyticsStats,
  analyticsData
};
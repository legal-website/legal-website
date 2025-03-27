import * as googleapis from "googleapis"
const { google } = googleapis
import type { analyticsdata_v1beta } from "googleapis"

// Use the proper types from the googleapis library
type RunReportResponse = analyticsdata_v1beta.Schema$RunReportResponse
type Row = analyticsdata_v1beta.Schema$Row
type DimensionValue = analyticsdata_v1beta.Schema$DimensionValue
type MetricValue = analyticsdata_v1beta.Schema$MetricValue

// Create a safe slice function to handle potentially undefined arrays
export const safeSlice = <T>(arr: T[] | undefined | null, start: number, end?: number): T[] => {
  if (!arr || !Array.isArray(arr)) {
    return [];
  }
  return arr.slice(start, end);
};

// Initialize the auth client
export const getAuthClient = () => {
  try {
    return new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
  } catch (error: any) {
    console.error('Error initializing auth client:', error);
    throw error;
  }
};

// Test the GA4 connection
export const testGA4Connection = async () => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID; // This should be your GA4 property ID (G-XXXXXXXX)
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    // Run a simple report to test the connection
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate: '7daysAgo',
            endDate: 'today',
          },
        ],
        dimensions: [
          {
            name: 'date',
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
      }
    });
    
    const rows = response.data.rows || [];
    
    return {
      success: true,
      hasData: rows.length > 0,
      sampleData: safeSlice(rows, 0, 3),
    };
  } catch (error: any) {
    console.error('Error testing GA4 connection:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get page views over time
export const getPageViewsOverTime = async (startDate: string, endDate: string) => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID;
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        dimensions: [
          {
            name: 'date',
          },
        ],
        metrics: [
          {
            name: 'screenPageViews',
          },
        ],
      }
    });
    
    const rows = response.data.rows || [];
    
    return rows.map((row: Row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      value: parseInt(row.metricValues?.[0]?.value || '0', 10),
    }));
  } catch (error: any) {
    console.error('Error fetching page views:', error);
    return [];
  }
};

// Get summary metrics
export const getSummaryMetrics = async (startDate: string, endDate: string) => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID;
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          {
            name: 'totalUsers',
          },
          {
            name: 'newUsers',
          },
          {
            name: 'sessions',
          },
          {
            name: 'screenPageViews',
          },
          {
            name: 'averageSessionDuration',
          },
          {
            name: 'bounceRate',
          },
        ],
      }
    });
    
    const metrics = response.data.rows?.[0]?.metricValues || [];
    
    return {
      users: parseInt(metrics[0]?.value || '0', 10),
      newUsers: parseInt(metrics[1]?.value || '0', 10),
      sessions: parseInt(metrics[2]?.value || '0', 10),
      pageviews: parseInt(metrics[3]?.value || '0', 10),
      avgSessionDuration: parseFloat(metrics[4]?.value || '0'),
      bounceRate: parseFloat(metrics[5]?.value || '0'),
    };
  } catch (error: any) {
    console.error('Error fetching summary metrics:', error);
    return {
      users: 0,
      newUsers: 0,
      sessions: 0,
      pageviews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
    };
  }
};

// Get top pages
export const getTopPages = async (startDate: string, endDate: string, limit = 10) => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID;
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        dimensions: [
          {
            name: 'pagePath',
          },
        ],
        metrics: [
          {
            name: 'screenPageViews',
          },
          {
            name: 'averageSessionDuration',
          },
        ],
        orderBys: [
          {
            metric: {
              metricName: 'screenPageViews',
            },
            desc: true,
          },
        ],
        limit: String(limit),  // Convert to string as required by the API
      }
    });
    
    const rows = response.data.rows || [];
    
    return rows.map((row: Row) => {
      const page = row.dimensionValues?.[0]?.value || '';
      return {
        page,
        pageviews: parseInt(row.metricValues?.[0]?.value || '0', 10),
        avgTimeOnPage: parseFloat(row.metricValues?.[1]?.value || '0'),
      };
    });
  } catch (error: any) {
    console.error('Error fetching top pages:', error);
    return [];
  }
};

// Get traffic sources
export const getTrafficSources = async (startDate: string, endDate: string) => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID;
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        dimensions: [
          {
            name: 'sessionSource',
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
        orderBys: [
          {
            metric: {
              metricName: 'sessions',
            },
            desc: true,
          },
        ],
        limit: '7',  // Convert to string as required by the API
      }
    });
    
    const rows = response.data.rows || [];
    
    return rows.map((row: Row) => {
      const source = row.dimensionValues?.[0]?.value || 'direct';
      return {
        source,
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
      };
    });
  } catch (error: any) {
    console.error('Error fetching traffic sources:', error);
    return [];
  }
};

// Get device categories
export const getDeviceCategories = async (startDate: string, endDate: string) => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID;
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        dimensions: [
          {
            name: 'deviceCategory',
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
      }
    });
    
    const rows = response.data.rows || [];
    
    return rows.map((row: Row) => ({
      device: row.dimensionValues?.[0]?.value || 'unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
    }));
  } catch (error: any) {
    console.error('Error fetching device categories:', error);
    return [];
  }
};

// Get countries
export const getCountries = async (startDate: string, endDate: string) => {
  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_VIEW_ID;
    
    if (!propertyId) {
      throw new Error('Google Analytics Property ID not configured');
    }
    
    // Remove the 'G-' prefix if present
    const formattedPropertyId = propertyId.replace(/^G-/, '');
    
    const auth = getAuthClient();
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    const response = await analyticsData.properties.runReport({
      property: `properties/${formattedPropertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        dimensions: [
          {
            name: 'country',
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
        orderBys: [
          {
            metric: {
              metricName: 'sessions',
            },
            desc: true,
          },
        ],
        limit: '7',  // Convert to string as required by the API
      }
    });
    
    const rows = response.data.rows || [];
    
    return rows.map((row: Row) => {
      const country = row.dimensionValues?.[0]?.value || 'unknown';
      const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
      return {
        country,
        users,
      };
    });
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    return [];
  }
};


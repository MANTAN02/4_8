import { Router } from 'express';
import { validate } from './validation';
import { z } from 'zod';
import { logInfo, logError } from './logger';
import { mumbaiLocationService } from './mumbai-location-service';
import { rateLimitConfigs } from './advanced-middleware';

const router = Router();

// Apply moderate rate limiting
router.use(rateLimitConfigs.moderate);

// Validation schemas
const nearbyBusinessesSchema = z.object({
  latitude: z.number().min(18.8).max(19.5).optional(),
  longitude: z.number().min(72.7).max(73.2).optional(),
  pincode: z.string().regex(/^400[0-9]{3}$/).optional(),
  area_id: z.string().optional(),
  radius: z.number().min(0.5).max(20).default(5),
  category: z.string().optional(),
  limit: z.number().min(1).max(50).default(20)
}).refine(data => 
  data.latitude && data.longitude || data.pincode || data.area_id,
  { message: "Either coordinates, pincode, or area_id must be provided" }
);

const locationUpdateSchema = z.object({
  latitude: z.number().min(18.8).max(19.5),
  longitude: z.number().min(72.7).max(73.2),
  address: z.string().min(10).max(500),
  pincode: z.string().regex(/^400[0-9]{3}$/, 'Invalid Mumbai pincode')
});

// === MUMBAI AREAS ===

// Get all Mumbai areas
router.get('/areas', async (req, res) => {
  try {
    const areas = await mumbaiLocationService.getAllAreas();
    
    res.json({
      success: true,
      areas: areas.map(area => ({
        id: area.id,
        name: area.name,
        zone: area.zone,
        latitude: area.latitude,
        longitude: area.longitude,
        pincodes: area.pincode_range.split(',')
      })),
      total: areas.length
    });
  } catch (error) {
    logError(error as Error, { context: 'Get Mumbai areas' });
    res.status(500).json({
      error: 'Failed to get Mumbai areas',
      success: false
    });
  }
});

// Get area details by ID
router.get('/areas/:area_id', async (req, res) => {
  try {
    const { area_id } = req.params;
    const area = await mumbaiLocationService.getAreaById(area_id);
    
    if (!area) {
      return res.status(404).json({
        error: 'Area not found',
        success: false
      });
    }
    
    res.json({
      success: true,
      area: {
        id: area.id,
        name: area.name,
        zone: area.zone,
        latitude: area.latitude,
        longitude: area.longitude,
        pincodes: area.pincode_range.split(',')
      }
    });
  } catch (error) {
    logError(error as Error, { context: 'Get area by ID', area_id: req.params.area_id });
    res.status(500).json({
      error: 'Failed to get area details',
      success: false
    });
  }
});

// Get area by pincode
router.get('/areas/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    
    // Validate Mumbai pincode format
    if (!mumbaiLocationService.isValidMumbaiPincode(pincode)) {
      return res.status(400).json({
        error: 'Invalid Mumbai pincode',
        success: false
      });
    }
    
    const area = await mumbaiLocationService.getAreaByPincode(pincode);
    
    if (!area) {
      return res.status(404).json({
        error: 'No area found for this pincode',
        success: false
      });
    }
    
    res.json({
      success: true,
      area: {
        id: area.id,
        name: area.name,
        zone: area.zone,
        latitude: area.latitude,
        longitude: area.longitude
      }
    });
  } catch (error) {
    logError(error as Error, { context: 'Get area by pincode', pincode: req.params.pincode });
    res.status(500).json({
      error: 'Failed to get area by pincode',
      success: false
    });
  }
});

// === BUSINESS DISCOVERY ===

// Find nearby businesses
router.get('/businesses/nearby', validate({ query: nearbyBusinessesSchema }), async (req, res) => {
  try {
    const params = req.query;
    
    logInfo('Finding nearby businesses', params);
    
    const businesses = await mumbaiLocationService.findNearbyBusinesses(params);
    
    // Format businesses for response
    const formatted_businesses = businesses.map(business => ({
      id: business.id,
      business_name: business.business_name,
      category: business.category,
      address: business.address,
      pincode: business.pincode,
      rating_average: business.rating_average,
      rating_count: business.rating_count,
      is_verified: business.is_verified,
      distance: business.distance,
      bcoin_rate: business.bcoin_rate,
      total_transactions: business.total_transactions,
      latitude: business.latitude,
      longitude: business.longitude
    }));
    
    res.json({
      success: true,
      businesses: formatted_businesses,
      total: formatted_businesses.length,
      search_params: params
    });
  } catch (error) {
    logError(error as Error, { context: 'Find nearby businesses', query: req.query });
    res.status(500).json({
      error: 'Failed to find nearby businesses',
      success: false
    });
  }
});

// Get business distribution across Mumbai areas
router.get('/analytics/distribution', async (req, res) => {
  try {
    const distribution = await mumbaiLocationService.getBusinessDistribution();
    
    res.json({
      success: true,
      distribution,
      total_areas: distribution.length
    });
  } catch (error) {
    logError(error as Error, { context: 'Get business distribution' });
    res.status(500).json({
      error: 'Failed to get business distribution',
      success: false
    });
  }
});

// Get popular areas by business category
router.get('/analytics/popular-areas/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const popular_areas = await mumbaiLocationService.getPopularAreasByCategory(category);
    
    res.json({
      success: true,
      category,
      popular_areas,
      total: popular_areas.length
    });
  } catch (error) {
    logError(error as Error, { context: 'Get popular areas by category', category: req.params.category });
    res.status(500).json({
      error: 'Failed to get popular areas',
      success: false
    });
  }
});

// === LOCATION SEARCH & SUGGESTIONS ===

// Get location suggestions for autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
        query: query || ''
      });
    }
    
    const suggestions = await mumbaiLocationService.getLocationSuggestions(query);
    
    res.json({
      success: true,
      suggestions,
      query,
      total: suggestions.length
    });
  } catch (error) {
    logError(error as Error, { context: 'Get location suggestions', query: req.query.q });
    res.status(500).json({
      error: 'Failed to get location suggestions',
      success: false
    });
  }
});

// Validate Mumbai location coordinates
router.post('/validate-coordinates', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude and longitude are required',
        success: false
      });
    }
    
    const is_valid = mumbaiLocationService.isValidMumbaiLocation(latitude, longitude);
    
    if (!is_valid) {
      return res.json({
        success: false,
        is_valid: false,
        message: 'Location is outside Mumbai boundaries'
      });
    }
    
    // Get the area for these coordinates
    const area = await mumbaiLocationService.getAreaByCoordinates(latitude, longitude);
    
    res.json({
      success: true,
      is_valid: true,
      area: area ? {
        id: area.id,
        name: area.name,
        zone: area.zone
      } : null,
      message: area ? `Location is in ${area.name}` : 'Valid Mumbai location'
    });
  } catch (error) {
    logError(error as Error, { context: 'Validate coordinates', body: req.body });
    res.status(500).json({
      error: 'Failed to validate coordinates',
      success: false
    });
  }
});

// Validate Mumbai pincode
router.post('/validate-pincode', async (req, res) => {
  try {
    const { pincode } = req.body;
    
    if (!pincode) {
      return res.status(400).json({
        error: 'Pincode is required',
        success: false
      });
    }
    
    const is_valid = mumbaiLocationService.isValidMumbaiPincode(pincode);
    
    if (!is_valid) {
      return res.json({
        success: false,
        is_valid: false,
        message: 'Not a valid Mumbai pincode'
      });
    }
    
    // Get the area for this pincode
    const area = await mumbaiLocationService.getAreaByPincode(pincode);
    
    res.json({
      success: true,
      is_valid: true,
      area: area ? {
        id: area.id,
        name: area.name,
        zone: area.zone
      } : null,
      message: area ? `Pincode is in ${area.name}` : 'Valid Mumbai pincode'
    });
  } catch (error) {
    logError(error as Error, { context: 'Validate pincode', body: req.body });
    res.status(500).json({
      error: 'Failed to validate pincode',
      success: false
    });
  }
});

// === BUSINESS LOCATION MANAGEMENT ===

// Update business location (requires authentication)
router.put('/business/:business_id/location', validate({ body: locationUpdateSchema }), async (req, res) => {
  try {
    const { business_id } = req.params;
    const location = req.body;
    
    // Note: In a real implementation, you'd verify the user owns this business
    // For now, we'll assume the business_id is valid
    
    const success = await mumbaiLocationService.updateBusinessLocation(business_id, location);
    
    if (success) {
      // Get updated area information
      const area = await mumbaiLocationService.getAreaByPincode(location.pincode);
      
      res.json({
        success: true,
        message: 'Business location updated successfully',
        location: {
          ...location,
          area: area ? {
            id: area.id,
            name: area.name,
            zone: area.zone
          } : null
        }
      });
    } else {
      res.status(400).json({
        error: 'Failed to update business location',
        success: false
      });
    }
  } catch (error) {
    logError(error as Error, { 
      context: 'Update business location', 
      business_id: req.params.business_id,
      body: req.body
    });
    
    res.status(500).json({
      error: error.message || 'Failed to update business location',
      success: false
    });
  }
});

// Calculate distance between two locations
router.post('/calculate-distance', async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) {
      return res.status(400).json({
        error: 'From and to coordinates are required',
        success: false
      });
    }
    
    const distance = mumbaiLocationService.calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
    
    res.json({
      success: true,
      distance_km: Math.round(distance * 100) / 100,
      from,
      to
    });
  } catch (error) {
    logError(error as Error, { context: 'Calculate distance', body: req.body });
    res.status(500).json({
      error: 'Failed to calculate distance',
      success: false
    });
  }
});

// === UTILITY ENDPOINTS ===

// Get Mumbai location service status
router.get('/status', async (req, res) => {
  try {
    const areas = await mumbaiLocationService.getAllAreas();
    const distribution = await mumbaiLocationService.getBusinessDistribution();
    
    res.json({
      success: true,
      status: 'active',
      mumbai_areas_count: areas.length,
      total_businesses: distribution.reduce((sum, area) => sum + area.business_count, 0),
      verified_businesses: distribution.reduce((sum, area) => sum + area.verified_count, 0),
      service_version: '1.0.0'
    });
  } catch (error) {
    logError(error as Error, { context: 'Get location service status' });
    res.status(500).json({
      error: 'Failed to get service status',
      success: false
    });
  }
});

export default router;
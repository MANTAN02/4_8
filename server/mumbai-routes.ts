import { Router } from 'express';
import { mumbaiLocationService } from './mumbai-location-service';
import { authenticateToken } from './enhanced-auth';
import { rateLimitConfigs } from './advanced-middleware';

const router = Router();

// Apply rate limiting
router.use(rateLimitConfigs.api);

// Get all Mumbai areas
router.get('/areas', async (req, res) => {
  try {
    const areas = await mumbaiLocationService.getAllAreas();
    res.json({ success: true, areas });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get areas' });
  }
});

// Find nearby businesses
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, pincode, area_id, category, radius, limit } = req.query;
    
    const businesses = await mumbaiLocationService.findNearbyBusinesses({
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      pincode: pincode as string,
      area_id: area_id as string,
      category: category as string,
      radius: radius ? parseInt(radius as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json({ success: true, businesses, count: businesses.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find businesses' });
  }
});

// Get business distribution
router.get('/distribution', async (req, res) => {
  try {
    const distribution = await mumbaiLocationService.getBusinessDistribution();
    res.json({ success: true, distribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get distribution' });
  }
});

// Get location suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, suggestions: [] });
    
    const suggestions = await mumbaiLocationService.getLocationSuggestions(q as string);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Update business location (authenticated)
router.put('/business-location/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, address, pincode } = req.body;
    
    const success = await mumbaiLocationService.updateBusinessLocation(id, {
      latitude, longitude, address, pincode
    });
    
    if (success) {
      res.json({ success: true, message: 'Location updated' });
    } else {
      res.status(400).json({ error: 'Failed to update location' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
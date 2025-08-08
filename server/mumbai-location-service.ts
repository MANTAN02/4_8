import { superDb } from './super-database';
import { logInfo, logError } from './logger';
import { cacheManager } from './cache-manager';

// Mumbai area boundaries
const MUMBAI_AREAS = [
  {
    id: 'bandra_west',
    name: 'Bandra West',
    zone: 'Western',
    pincode_range: '400050,400051,400052',
    latitude: 19.0596,
    longitude: 72.8295,
    bounds: {
      north: 19.0700,
      south: 19.0400,
      east: 72.8400,
      west: 72.8100
    }
  },
  {
    id: 'andheri_east',
    name: 'Andheri East',
    zone: 'Western',
    pincode_range: '400069,400093,400099',
    latitude: 19.1136,
    longitude: 72.8697,
    bounds: {
      north: 19.1300,
      south: 19.0900,
      east: 72.8900,
      west: 72.8500
    }
  },
  {
    id: 'powai',
    name: 'Powai',
    zone: 'Central',
    pincode_range: '400076',
    latitude: 19.1176,
    longitude: 72.9060,
    bounds: {
      north: 19.1300,
      south: 19.1000,
      east: 72.9200,
      west: 72.8900
    }
  },
  {
    id: 'thane_west',
    name: 'Thane West',
    zone: 'Thane',
    pincode_range: '400601,400602,400604,400605,400606,400607,400608,400610',
    latitude: 19.2183,
    longitude: 72.9781,
    bounds: {
      north: 19.2400,
      south: 19.1900,
      east: 73.0000,
      west: 72.9500
    }
  },
  {
    id: 'navi_mumbai',
    name: 'Navi Mumbai',
    zone: 'Navi Mumbai',
    pincode_range: '400614,400703,400704,400705,400706,400708,400709,400710',
    latitude: 19.0330,
    longitude: 73.0297,
    bounds: {
      north: 19.1000,
      south: 18.9500,
      east: 73.1000,
      west: 72.9500
    }
  }
];

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface MumbaiArea {
  id: string;
  name: string;
  zone: string;
  pincode_range: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

interface BusinessLocation extends LocationCoordinates {
  address: string;
  pincode: string;
  area_id?: string;
}

interface LocationSearchParams {
  latitude?: number;
  longitude?: number;
  pincode?: string;
  area_id?: string;
  radius?: number; // in kilometers
  category?: string;
  limit?: number;
}

class MumbaiLocationService {
  
  // Initialize Mumbai areas in database
  async initializeMumbaiAreas(): Promise<void> {
    try {
      logInfo('Initializing Mumbai areas...');
      
      for (const area of MUMBAI_AREAS) {
        await superDb.execute(`
          INSERT OR REPLACE INTO mumbai_areas (
            id, name, zone, pincode_range, latitude, longitude, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `, [
          area.id,
          area.name,
          area.zone,
          area.pincode_range,
          area.latitude,
          area.longitude,
          new Date().toISOString()
        ]);
      }
      
      logInfo('Mumbai areas initialized successfully');
    } catch (error) {
      logError(error as Error, { context: 'Mumbai areas initialization' });
    }
  }
  
  // Get all Mumbai areas
  async getAllAreas(): Promise<MumbaiArea[]> {
    try {
      const cached_key = 'mumbai_areas:all';
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      const result = await superDb.execute(`
        SELECT * FROM mumbai_areas WHERE is_active = 1 ORDER BY name
      `);
      
      const areas = result as MumbaiArea[];
      
      // Cache for 1 hour
      await cacheManager.set(cached_key, areas, 60 * 60 * 1000);
      
      return areas;
    } catch (error) {
      logError(error as Error, { context: 'Get all Mumbai areas' });
      return [];
    }
  }
  
  // Get area by pincode
  async getAreaByPincode(pincode: string): Promise<MumbaiArea | null> {
    try {
      const cached_key = `mumbai_area:pincode:${pincode}`;
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      const result = await superDb.execute(`
        SELECT * FROM mumbai_areas 
        WHERE pincode_range LIKE '%' || ? || '%' AND is_active = 1
        LIMIT 1
      `, [pincode]);
      
      const area = result[0] as MumbaiArea || null;
      
      if (area) {
        // Cache for 24 hours
        await cacheManager.set(cached_key, area, 24 * 60 * 60 * 1000);
      }
      
      return area;
    } catch (error) {
      logError(error as Error, { context: 'Get area by pincode', pincode });
      return null;
    }
  }
  
  // Get area by coordinates
  async getAreaByCoordinates(latitude: number, longitude: number): Promise<MumbaiArea | null> {
    try {
      const cached_key = `mumbai_area:coords:${latitude}:${longitude}`;
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      // Find the closest area using distance calculation
      const result = await superDb.execute(`
        SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance 
        FROM mumbai_areas 
        WHERE is_active = 1
        ORDER BY distance
        LIMIT 1
      `, [latitude, longitude, latitude]);
      
      const area = result[0] as (MumbaiArea & { distance: number }) || null;
      
      // Only return if within 10km of area center
      if (area && area.distance <= 10) {
        const areaResult = { ...area };
        delete areaResult.distance;
        
        // Cache for 1 hour
        await cacheManager.set(cached_key, areaResult, 60 * 60 * 1000);
        
        return areaResult as MumbaiArea;
      }
      
      return null;
    } catch (error) {
      logError(error as Error, { context: 'Get area by coordinates', latitude, longitude });
      return null;
    }
  }
  
  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  // Find nearby businesses
  async findNearbyBusinesses(params: LocationSearchParams): Promise<any[]> {
    try {
      const {
        latitude,
        longitude,
        pincode,
        area_id,
        radius = 5, // default 5km
        category,
        limit = 20
      } = params;
      
      let query = '';
      let queryParams: any[] = [];
      
      if (latitude && longitude) {
        // Search by coordinates
        query = `
          SELECT b.*, 
          (6371 * acos(cos(radians(?)) * cos(radians(b.latitude)) * 
          cos(radians(b.longitude) - radians(?)) + sin(radians(?)) * 
          sin(radians(b.latitude)))) AS distance 
          FROM businesses b
          WHERE b.is_verified = 1 AND b.is_active = 1
        `;
        queryParams = [latitude, longitude, latitude];
        
        if (category) {
          query += ` AND b.category = ?`;
          queryParams.push(category);
        }
        
        query += ` HAVING distance <= ? ORDER BY distance LIMIT ?`;
        queryParams.push(radius, limit);
        
      } else if (pincode) {
        // Search by pincode
        query = `
          SELECT b.*, 0 as distance
          FROM businesses b
          WHERE b.pincode = ? AND b.is_verified = 1 AND b.is_active = 1
        `;
        queryParams = [pincode];
        
        if (category) {
          query += ` AND b.category = ?`;
          queryParams.push(category);
        }
        
        query += ` ORDER BY b.rating_average DESC, b.total_transactions DESC LIMIT ?`;
        queryParams.push(limit);
        
      } else if (area_id) {
        // Get area details and search by pincode range
        const area = await this.getAreaById(area_id);
        if (!area) return [];
        
        const pincodes = area.pincode_range.split(',');
        const pincode_placeholders = pincodes.map(() => '?').join(',');
        
        query = `
          SELECT b.*, 0 as distance
          FROM businesses b
          WHERE b.pincode IN (${pincode_placeholders}) 
            AND b.is_verified = 1 AND b.is_active = 1
        `;
        queryParams = [...pincodes];
        
        if (category) {
          query += ` AND b.category = ?`;
          queryParams.push(category);
        }
        
        query += ` ORDER BY b.rating_average DESC, b.total_transactions DESC LIMIT ?`;
        queryParams.push(limit);
      }
      
      if (!query) return [];
      
      const result = await superDb.execute(query, queryParams);
      
      return result.map((business: any) => ({
        ...business,
        distance: Math.round(business.distance * 100) / 100 // Round to 2 decimal places
      }));
      
    } catch (error) {
      logError(error as Error, { context: 'Find nearby businesses', params });
      return [];
    }
  }
  
  // Get area by ID
  async getAreaById(area_id: string): Promise<MumbaiArea | null> {
    try {
      const cached_key = `mumbai_area:id:${area_id}`;
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      const result = await superDb.execute(`
        SELECT * FROM mumbai_areas WHERE id = ? AND is_active = 1
      `, [area_id]);
      
      const area = result[0] as MumbaiArea || null;
      
      if (area) {
        // Cache for 24 hours
        await cacheManager.set(cached_key, area, 24 * 60 * 60 * 1000);
      }
      
      return area;
    } catch (error) {
      logError(error as Error, { context: 'Get area by ID', area_id });
      return null;
    }
  }
  
  // Validate Mumbai location
  isValidMumbaiLocation(latitude: number, longitude: number): boolean {
    // Mumbai bounding box (approximate)
    const MUMBAI_BOUNDS = {
      north: 19.3000,
      south: 18.8900,
      east: 73.1000,
      west: 72.7700
    };
    
    return (
      latitude >= MUMBAI_BOUNDS.south &&
      latitude <= MUMBAI_BOUNDS.north &&
      longitude >= MUMBAI_BOUNDS.west &&
      longitude <= MUMBAI_BOUNDS.east
    );
  }
  
  // Validate Mumbai pincode
  isValidMumbaiPincode(pincode: string): boolean {
    const mumbai_pincode_patterns = [
      /^400[0-9]{3}$/, // Mumbai city
      /^400[6-7][0-9]{2}$/, // Thane and Navi Mumbai
    ];
    
    return mumbai_pincode_patterns.some(pattern => pattern.test(pincode));
  }
  
  // Get business distribution by area
  async getBusinessDistribution(): Promise<any[]> {
    try {
      const cached_key = 'mumbai_business_distribution';
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      const result = await superDb.execute(`
        SELECT 
          ma.name as area_name,
          ma.zone,
          COUNT(b.id) as business_count,
          COUNT(CASE WHEN b.is_verified = 1 THEN 1 END) as verified_count,
          AVG(b.rating_average) as avg_rating,
          SUM(b.total_transactions) as total_transactions
        FROM mumbai_areas ma
        LEFT JOIN businesses b ON b.pincode IN (
          SELECT TRIM(value) FROM json_each('["' || REPLACE(ma.pincode_range, ',', '","') || '"]')
        ) AND b.is_active = 1
        WHERE ma.is_active = 1
        GROUP BY ma.id, ma.name, ma.zone
        ORDER BY business_count DESC
      `);
      
      // Cache for 30 minutes
      await cacheManager.set(cached_key, result, 30 * 60 * 1000);
      
      return result;
    } catch (error) {
      logError(error as Error, { context: 'Get business distribution' });
      return [];
    }
  }
  
  // Update business location
  async updateBusinessLocation(
    business_id: string, 
    location: BusinessLocation
  ): Promise<boolean> {
    try {
      const { latitude, longitude, address, pincode } = location;
      
      // Validate Mumbai location
      if (!this.isValidMumbaiLocation(latitude, longitude)) {
        throw new Error('Location is outside Mumbai boundaries');
      }
      
      if (!this.isValidMumbaiPincode(pincode)) {
        throw new Error('Invalid Mumbai pincode');
      }
      
      // Get area by pincode
      const area = await this.getAreaByPincode(pincode);
      
      await superDb.execute(`
        UPDATE businesses 
        SET 
          latitude = ?,
          longitude = ?,
          address = ?,
          pincode = ?,
          area_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [latitude, longitude, address, pincode, area?.id, business_id]);
      
      // Clear business cache
      await cacheManager.del(`business:${business_id}`);
      await cacheManager.del('mumbai_business_distribution');
      
      logInfo('Business location updated', {
        business_id,
        pincode,
        area_id: area?.id
      });
      
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Update business location', business_id, location });
      return false;
    }
  }
  
  // Get popular areas for business categories
  async getPopularAreasByCategory(category: string): Promise<any[]> {
    try {
      const cached_key = `popular_areas:${category}`;
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      const result = await superDb.execute(`
        SELECT 
          ma.id,
          ma.name,
          ma.zone,
          COUNT(b.id) as business_count,
          AVG(b.rating_average) as avg_rating,
          SUM(b.total_transactions) as total_transactions
        FROM mumbai_areas ma
        JOIN businesses b ON b.pincode IN (
          SELECT TRIM(value) FROM json_each('["' || REPLACE(ma.pincode_range, ',', '","') || '"]')
        )
        WHERE b.category = ? AND b.is_verified = 1 AND b.is_active = 1
        GROUP BY ma.id, ma.name, ma.zone
        HAVING business_count > 0
        ORDER BY total_transactions DESC, business_count DESC
        LIMIT 10
      `, [category]);
      
      // Cache for 1 hour
      await cacheManager.set(cached_key, result, 60 * 60 * 1000);
      
      return result;
    } catch (error) {
      logError(error as Error, { context: 'Get popular areas by category', category });
      return [];
    }
  }
  
  // Get location suggestions for autocomplete
  async getLocationSuggestions(query: string): Promise<any[]> {
    try {
      if (query.length < 2) return [];
      
      const cached_key = `location_suggestions:${query.toLowerCase()}`;
      const cached = await cacheManager.get(cached_key);
      if (cached) return cached;
      
      const suggestions = [];
      
      // Search in areas
      const areas = await superDb.execute(`
        SELECT id, name, zone, 'area' as type
        FROM mumbai_areas 
        WHERE name LIKE '%' || ? || '%' AND is_active = 1
        ORDER BY name
        LIMIT 5
      `, [query]);
      
      suggestions.push(...areas);
      
      // Search in business locations (famous landmarks)
      const landmarks = await superDb.execute(`
        SELECT DISTINCT address as name, pincode, 'landmark' as type
        FROM businesses 
        WHERE address LIKE '%' || ? || '%' AND is_verified = 1 AND is_active = 1
        ORDER BY total_transactions DESC
        LIMIT 5
      `, [query]);
      
      suggestions.push(...landmarks);
      
      // Cache for 1 hour
      await cacheManager.set(cached_key, suggestions, 60 * 60 * 1000);
      
      return suggestions;
    } catch (error) {
      logError(error as Error, { context: 'Get location suggestions', query });
      return [];
    }
  }
}

// Export singleton instance
export const mumbaiLocationService = new MumbaiLocationService();

// Initialize Mumbai areas on startup
mumbaiLocationService.initializeMumbaiAreas().catch(error => {
  logError(error, { context: 'Mumbai areas initialization on startup' });
});

export default mumbaiLocationService;
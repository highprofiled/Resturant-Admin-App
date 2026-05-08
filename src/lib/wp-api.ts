import { apiRequest } from './api';

export interface WPConfig {
  url: string;
  apiKey: string;
  endpoint: string; // e.g., /wp-json/wptbp/v1/bookings
}

export interface Reservation {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  type: string;
  typeDesc?: string;
  table: string;
  status: 'Pending' | 'Approved' | 'Declined' | 'Completed';
}

// Fallback Mock Data
export const mockReservations: Reservation[] = [
  {
    id: 1,
    name: 'Stephanie Davison',
    email: 'stephanie.davison@example.com',
    phone: '909-539-3238',
    guests: 80,
    date: 'Dec 4, 2026',
    time: '6:00 PM',
    type: 'PARTY',
    typeDesc: 'Corporate',
    table: 'Manual Assign',
    status: 'Pending',
  },
  {
    id: 2,
    name: 'Jason White',
    email: 'jasw71@example.com',
    phone: '765-623-6944',
    guests: 2,
    date: 'May 9, 2026',
    time: '8:30 PM',
    type: 'STANDARD',
    table: '1',
    status: 'Approved',
  },
  {
    id: 3,
    name: 'Zachary Durkee',
    email: 'durkeezachary@example.com',
    phone: '864-437-5714',
    guests: 2,
    date: 'May 9, 2026',
    time: '4:15 PM',
    type: 'STANDARD',
    table: '1',
    status: 'Pending',
  }
];

export class WPServices {
  static async getConfig(): Promise<WPConfig | null> {
    try {
      const data = await apiRequest('get_settings');
      if (data.settings && data.settings.wp) return data.settings.wp;
    } catch (e) {
      console.error("Failed to read WP Config", e);
    }
    return null;
  }

  static async saveConfig(config: WPConfig): Promise<void> {
    await apiRequest('save_settings', { key: 'wp', value: config });
  }

  static getHeaders(config: WPConfig) {
    return {
      'X-WPTBP-API-Key': config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  static async getReservations(): Promise<Reservation[]> {
    const config = await this.getConfig();
    if (!config || !config.url || !config.endpoint) {
      console.log("No WP Config found, returning mock data.");
      return mockReservations;
    }

    try {
      const cleanUrl = config.url.replace(/\/$/, '');
      const cleanEndpoint = config.endpoint.replace(/^\//, '');
      const targetUrl = `${cleanUrl}/${cleanEndpoint}`;

      const data = await apiRequest('wp_proxy', {
        url: targetUrl,
        method: 'GET',
        headers: this.getHeaders(config),
      });
      
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          id: item.id || Math.random(),
          name: item.name || item.customer_name || 'Unknown',
          email: item.email || item.customer_email || '',
          phone: item.phone || item.customer_phone || '',
          guests: parseInt(item.guests || item.party_size || '1', 10),
          date: item.date || item.booking_date || '',
          time: item.time || item.booking_time || '',
          type: item.type || 'STANDARD',
          table: item.table || 'Unassigned',
          status: item.status === 'approved' ? 'Approved' : (item.status === 'declined' ? 'Declined' : 'Pending'),
        }));
      } else {
        throw new Error(data.message || 'Invalid data returned from WordPress');
      }
    } catch (error: any) {
      console.error("WP API Fetch Error:", error);
      throw new Error(error.message || 'Failed to fetch reservations');
    }
  }

  static async updatePluginSettings(settings: any): Promise<boolean> {
    const config = await this.getConfig();
    if (!config || !config.url || !config.endpoint) {
      console.log('Mock Update Plugin Settings:', settings);
      return true; // Mock success
    }

    try {
      const cleanUrl = config.url.replace(/\/$/, '');
      const cleanEndpoint = config.endpoint.replace(/^\//, '').replace(/bookings\/?$/, 'settings'); // naive replace bookings with settings
      const targetUrl = `${cleanUrl}/${cleanEndpoint}`;

      await apiRequest('wp_proxy', {
        url: targetUrl,
        method: 'POST',
        headers: this.getHeaders(config),
        body: JSON.stringify(settings)
      });

      return true;
    } catch (error: any) {
      console.error("WP API Settings Update Error:", error);
      throw new Error('WP API Settings Update Error: ' + (error.message || 'Could not connect to WordPress.'));
    }
  }

  static async updateReservationStatus(id: string | number, status: 'Approved' | 'Declined' | 'Completed' | 'Pending'): Promise<boolean> {
    const config = await this.getConfig();
    if (!config || !config.url || !config.endpoint) {
      console.log(`Mock Update: Reservation ${id} status to ${status}`);
      return true; // Mock success
    }

    try {
      const cleanUrl = config.url.replace(/\/$/, '');
      const cleanEndpoint = config.endpoint.replace(/^\//, '');
      const targetUrl = `${cleanUrl}/${cleanEndpoint}/${id}`;

      await apiRequest('wp_proxy', {
        url: targetUrl,
        method: 'POST', // or PUT depending on your WP REST API
        headers: this.getHeaders(config),
        body: JSON.stringify({ status: status.toLowerCase() })
      });

      return true;
    } catch (error: any) {
      console.error("WP API Update Error:", error);
      throw new Error('Failed to update status: ' + (error.message || 'Unknown error'));
    }
  }
}

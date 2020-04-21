import { ApiService, ApiRequestConfig } from './apiService';
import { CalendarItem } from '../models/Soc';

export interface CalendarStore {
}

export interface CalendarOptions {

}

export class CalendarService {
    private options: CalendarOptions = {
    };

    public store: CalendarStore = {
    };

    private apiService: ApiService;

    constructor(apiService: ApiService, options?: CalendarOptions) {
        this.apiService = apiService;
        this.options = { ...this.options, ...options };
    }

    public async getCalendarItems(calendarId: string, startDate: Date, endDate: Date, limit: number, options?: ApiRequestConfig): Promise<CalendarItem[] | null> {
        options = {
            ...options,
            headers: {
                filters: [
                    "SOC.CalendarItem:key|id|meta|title|fullAvatar|startDate|endDate|allDay"
                ]
            }
        };
        let response = await this.apiService.get('api/soc/v1/calendars/' + calendarId + "/items", { ...options, params: { startDate: startDate, endDate: endDate, limit: limit } });
        if (response) return response.data;
        return null;
    }

    public async getCalendarItem(calendarId: string, itemId: string, options?: ApiRequestConfig): Promise<CalendarItem | null> {
        let response = await this.apiService.get('api/soc/v1/calendars/' + calendarId + "/item/" + itemId, options);
        if (response) return response.data;
        return null;
    }

    public async deleteCalendarItem(calendarId: string, itemId: string, options?: ApiRequestConfig): Promise<CalendarItem | null> {
        let response = await this.apiService.delete('api/soc/v1/calendars/' + calendarId + "/item/" + itemId, options);
        if (response) return response.data;
        return null;
    }

    public async putCalendarItem(calendarId: string, item: CalendarItem, options?: ApiRequestConfig): Promise<CalendarItem | null> {
        let response = await this.apiService.put('api/soc/v1/calendars/' + calendarId + "/item", item, options);
        if (response) return response.data;
        return null;
    }

    public async updateCalendarItem(calendarId: string, itemId: string, item: CalendarItem, options?: ApiRequestConfig): Promise<CalendarItem | null> {
        let response = await this.apiService.post('api/soc/v1/calendars/' + calendarId + "/item/" + itemId, item, options);
        if (response) return response.data;
        return null;
    }
}
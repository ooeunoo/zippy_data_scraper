import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { IContent } from '../app/interfaces/content';
export declare class SupabaseService {
    private configService;
    private _supabase;
    constructor(configService: ConfigService);
    get client(): SupabaseClient<any, "public", any>;
    createContents(data: IContent[]): Promise<void>;
    updateCategoryRunning(categoryId: number, running: boolean): Promise<void>;
    updateChannelRunning(channelId: number, running: boolean): Promise<void>;
}

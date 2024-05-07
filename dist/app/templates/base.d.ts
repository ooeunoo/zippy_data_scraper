import { Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { IChannel } from '../interfaces/channel';
import { ICategory } from '../interfaces/category';
export declare abstract class TaskBase implements OnModuleInit {
    supabaseService: SupabaseService;
    id: number;
    abstract isChannelRunning: boolean;
    abstract isCategoryRunning: Record<string, boolean>;
    abstract logger: Logger;
    channel: IChannel;
    categories: ICategory[];
    constructor(supabaseService: SupabaseService, id: number);
    onModuleInit(): Promise<void>;
    private _setupInfo;
    updateChannelStatus(status: boolean): Promise<void>;
    findExistsUrls(urls: string[]): Promise<any[]>;
    removeExistsUrls(newUrls: string[], existsUrls: string[]): string[];
}

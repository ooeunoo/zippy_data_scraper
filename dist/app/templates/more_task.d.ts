import { SupabaseService } from '../../supabase/supabase.service';
import { TaskBase } from './base';
export declare abstract class MoreTask extends TaskBase {
    supabaseService: SupabaseService;
    id: number;
    chunkSize: number;
    constructor(supabaseService: SupabaseService, id: number);
    abstract getContentUrls(startIndex: number): Promise<string[]>;
    abstract gatherContentUrls(): Promise<string[]>;
    abstract clickMore(): any;
}

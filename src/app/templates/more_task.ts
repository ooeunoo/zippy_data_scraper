import { SupabaseService } from '../../supabase/supabase.service';
import { TaskBase } from './base';

export abstract class MoreTask extends TaskBase {
  chunkSize = 50;

  constructor(
    public supabaseService: SupabaseService,
    public id: number,
  ) {
    super(supabaseService, id);
  }

  abstract getContentUrls(startIndex: number): Promise<string[]>;
  abstract gatherContentUrls(): Promise<string[]>;
  abstract clickMore();
}

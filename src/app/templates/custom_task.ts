import { Page } from 'puppeteer';
import { SupabaseService } from '../../supabase/supabase.service';
import { TaskBase } from './base';

export abstract class CustomTask extends TaskBase {
  constructor(public supabaseService: SupabaseService, public id: number) {
    super(supabaseService, id);
  }
}

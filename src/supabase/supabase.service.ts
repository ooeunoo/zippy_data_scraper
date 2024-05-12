import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { TABLE } from '../app/constants/table';
import { IContent } from '../app/interfaces/content';

@Injectable()
export class SupabaseService {
  private _supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this._supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_ANON_URL'),
    );
  }

  get client() {
    return this._supabase;
  }

  async createContents(data: IContent[]): Promise<{ result; error }> {
    try {
      const { data: result, error } = await this._supabase
        .from(TABLE.content)
        .insert(data);
      return { result, error };
    } catch (e) {
      console.log(e);
    }
  }

  async updateCategoryRunning(
    categoryId: number,
    running: boolean,
  ): Promise<void> {
    try {
      await this._supabase
        .from(TABLE.category)
        .update({ is_running: running })
        .eq('id', categoryId);
    } catch (e) {
      console.log(e);
    }
  }

  async updateChannelRunning(
    channelId: number,
    running: boolean,
  ): Promise<void> {
    try {
      await this._supabase
        .from(TABLE.channel)
        .update({ is_running: running })
        .eq('id', channelId);
    } catch (e) {
      console.log(e);
    }
  }

  // get insta post table where done false
  async getInstaPosts(): Promise<any> {
    try {
      const { data } = await this._supabase
        .from(TABLE.insta_post)
        .select('*')
        .eq('done', false);
      return data;
    } catch (e) {
      console.log(e);
    }
  }

  // update insta post row by id done true
  async updateInstaPostDone(id: number): Promise<void> {
    try {
      await this._supabase
        .from(TABLE.insta_post)
        .update({ done: true })
        .eq('id', id);
    } catch (e) {
      console.log(e);
    }
  }

  // insert png file to supabase storage
  async uploadInstaPostStorage(fileName: string, file: Buffer): Promise<void> {
    try {
      const { data, error } = await this._supabase.storage
        .from('insta_post')
        .upload(fileName, file);
      console.log(error);
    } catch (e) {
      console.log(e);
    }
  }
}

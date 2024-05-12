import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';
import { 디시인사이드 } from './community/디시인사이드';
import { TasksController } from './tasks.controller';
import { 개드립 } from './community/개드립';
import { 네이트판 } from './community/네이트판';
import { 루리웹 } from './community/루리웹';
import { 뽐뿌 } from './community/뽐뿌';
import { 에펨코리아 } from './community/에펨코리아';
import { 오늘의유머 } from './community/오늘의유머';
import { 웃긴대학 } from './community/웃긴대학';
import { 인스티즈 } from './community/인스티즈';
import { 엠엘비파크 } from './community/엠엘비파크';
import { 연합뉴스 } from './news/연합뉴스';
import { 클리앙 } from './community/클리앙';
import { TelegramModule } from '../telegram/telegram.module';
import { 인스타그램 } from './advertise/인스타그램';
import { 네이버뿜 } from './community/네이버뿜';

@Module({
  imports: [SupabaseModule, ConfigModule.forRoot(), TelegramModule],
  providers: [
    // 커뮤니티
    디시인사이드,
    개드립,
    네이트판,
    루리웹,
    뽐뿌,
    에펨코리아,
    오늘의유머,
    웃긴대학,
    인스티즈,
    클리앙,
    엠엘비파크,
    네이버뿜,

    // 뉴스
    연합뉴스,

    // 광고
    인스타그램,
  ],
  controllers: [TasksController],
})
export class TasksModule {}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Logger, Param, Post, Req } from '@nestjs/common';
import { 디시인사이드 } from './community/디시인사이드';
import { 개드립 } from './community/개드립';
import { TASK_MAP } from './task.constant';
import { 네이트판 } from './community/네이트판';
import { 루리웹 } from './community/루리웹';
import { 뽐뿌 } from './community/뽐뿌';
import { 에펨코리아 } from './community/에펨코리아';
import { 오늘의유머 } from './community/오늘의유머';
import { 웃긴대학 } from './community/웃긴대학';
import { 인스티즈 } from './community/인스티즈';
import { 클리앙 } from './community/클리앙';
import { 엠엘비파크 } from './community/엠엘비파크';
import { 연합뉴스 } from './news/연합뉴스';
import { 인스타그램 } from './advertise/인스타그램';
import { 네이버뿜 } from './community/네이버뿜';

@Controller('task')
export class TasksController {
  logger = new Logger('컨트롤러');

  constructor(
    // 커뮤니티
    private readonly _디시인사이드: 디시인사이드,
    private readonly _개드립: 개드립,
    private readonly _네이트판: 네이트판,
    private readonly _루리웹: 루리웹,
    private readonly _뽐뿌: 뽐뿌,
    private readonly _에펨코리아: 에펨코리아,
    private readonly _오늘의유머: 오늘의유머,
    private readonly _웃긴대학: 웃긴대학,
    private readonly _인스티즈: 인스티즈,
    private readonly _클리앙: 클리앙,
    private readonly _엠엘비파크: 엠엘비파크,
    private readonly _네이버뿜: 네이버뿜,

    // 뉴스
    private readonly _연합뉴스: 연합뉴스,

    // 광고
    private readonly _인스타그램: 인스타그램,
  ) {}

  @Post(':id')
  async start(@Param('id') id: string) {
    switch (id) {
      // 커뮤니티
      case TASK_MAP.디시인사이드.name:
        await this._디시인사이드.run();
        break;
      case TASK_MAP.개드립.name:
        await this._개드립.run();
        break;
      case TASK_MAP.네이트판.name:
        await this._네이트판.run();
        break;
      case TASK_MAP.루리웹.name:
        await this._루리웹.run();
        break;
      case TASK_MAP.뽐뿌.name:
        await this._뽐뿌.run();
        break;
      case TASK_MAP.에펨코리아.name:
        await this._에펨코리아.run();
        break;
      case TASK_MAP.오늘의유머.name:
        await this._오늘의유머.run();
        break;
      case TASK_MAP.웃긴대학.name:
        await this._웃긴대학.run();
        break;
      case TASK_MAP.인스티즈.name:
        await this._인스티즈.run();
        break;
      case TASK_MAP.클리앙.name:
        await this._클리앙.run();
        break;
      case TASK_MAP.엠엘비파크.name:
        await this._엠엘비파크.run();
        break;
      case TASK_MAP.네이버뿜.name:
        await this._네이버뿜.run();
        break;
      //뉴스
      case TASK_MAP.연합뉴스.name:
        await this._연합뉴스.run();
        break;
    }
    return true;
  }

  @Post('/limitpage/:page')
  async startAll(@Param('page') page: number) {
    try {
      try {
        await this._네이버뿜.run(page);
      } catch (e) {}
      try {
        await this._루리웹.run(page);
      } catch (e) {}
      try {
        await this._개드립.run(page);
      } catch (e) {}
      try {
        await this._네이트판.run(page);
      } catch (e) {}
      try {
        await this._뽐뿌.run(page);
      } catch (e) {}
      try {
        await this._디시인사이드.run(page);
      } catch (e) {}
      try {
        await this._에펨코리아.run(page);
      } catch (e) {}
      try {
        await this._오늘의유머.run(page);
      } catch (e) {}
      try {
        await this._웃긴대학.run(page);
      } catch (e) {}
      try {
        await this._인스티즈.run(page);
      } catch (e) {}
      try {
        await this._클리앙.run(page);
      } catch (e) {}
      try {
        await this._엠엘비파크.run(page);
      } catch (e) {}
      try {
        await this._루리웹.run(page);
      } catch (e) {}
      try {
        await this._개드립.run(page);
      } catch (e) {}
      try {
        await this._네이트판.run(page);
      } catch (e) {}
      try {
        await this._뽐뿌.run(page);
      } catch (e) {}
      try {
        await this._디시인사이드.run(page);
      } catch (e) {}
      try {
        await this._에펨코리아.run(page);
      } catch (e) {}
      try {
        await this._오늘의유머.run(page);
      } catch (e) {}
      try {
        await this._웃긴대학.run(page);
      } catch (e) {}
      try {
        await this._인스티즈.run(page);
      } catch (e) {}
      try {
        await this._클리앙.run(page);
      } catch (e) {}
      try {
        await this._엠엘비파크.run(page);
      } catch (e) {}
      try {
        await this._네이버뿜.run(page);
      } catch (e) {}
      this.logger.log('작업이 모두 완료되었습니다.');
    } catch (e) {
      console.log(e);
    }
    return true;
  }
}

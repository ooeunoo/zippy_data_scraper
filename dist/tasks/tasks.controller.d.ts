import { 디시인사이드 } from './community/디시인사이드';
import { 개드립 } from './community/개드립';
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
export declare class TasksController {
    private readonly _디시인사이드;
    private readonly _개드립;
    private readonly _네이트판;
    private readonly _루리웹;
    private readonly _뽐뿌;
    private readonly _에펨코리아;
    private readonly _오늘의유머;
    private readonly _웃긴대학;
    private readonly _인스티즈;
    private readonly _클리앙;
    private readonly _엠엘비파크;
    private readonly _연합뉴스;
    constructor(_디시인사이드: 디시인사이드, _개드립: 개드립, _네이트판: 네이트판, _루리웹: 루리웹, _뽐뿌: 뽐뿌, _에펨코리아: 에펨코리아, _오늘의유머: 오늘의유머, _웃긴대학: 웃긴대학, _인스티즈: 인스티즈, _클리앙: 클리앙, _엠엘비파크: 엠엘비파크, _연합뉴스: 연합뉴스);
    start(id: string): Promise<boolean>;
}

import { Injectable } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { getBrowser } from '../task.utils';
import { sleep } from '../../app/utils/time';
import * as fs from 'fs';
import { SupabaseService } from '../../supabase/supabase.service';
import { WAIT_UNTIL_NETWOKR_IDLE_2 } from '../../app/constants/value';
import { IInstaPost } from '../../app/interfaces/instaPost';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';

@Injectable()
export class 인스타그램 {
  private browser: Browser = null;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getDownloadContents(page: Page, instaPost: IInstaPost) {
    const urls = [];
    let nextTime = 0;

    while (true) {
      const boxes = await page.$$('._acaz');

      if (boxes.length === 2) {
        if (nextTime == 1) {
          break;
        }
        for await (const box of boxes) {
          const image = await box.$('img');
          const src = await image.evaluate((img) => img.getAttribute('src'));
          urls.push(src);
        }
      } else if (boxes.length === 3) {
        const lastBox = boxes[2];
        const image = await lastBox.$('img');
        const src = await image.evaluate((img) => img.getAttribute('src'));
        urls.push(src);
      }

      const nextButton = await page.$('._afxw._al46._al47');
      if (!nextButton) {
        break;
      } else {
        await nextButton.click();
        nextTime += 1;
      }

      const sleepTime = Math.floor(Math.random() * 5000) + 3000;
      await sleep(sleepTime);
    }

    // // urls loop and save image
    // if (!fs.existsSync(`./images/${title}`)) {
    //   fs.mkdirSync(`./images/${title}`, { recursive: true });
    // }

    // random uuid
    const baseFolder = instaPost.id.toString();

    const titleBuffer = await this.createThumbnail(instaPost.title);

    const uniqueUrls = new Set(urls);
    for (const url of uniqueUrls) {
      const index = urls.indexOf(url);
      const imageIndex = index + 1;
      const response = await fetch(url);
      const imageBuffer = await response.arrayBuffer();
      const fileName = `${baseFolder}/${imageIndex}.png`;
      await this.supabaseService.uploadInstaPostStorage(
        fileName,
        Buffer.from(imageBuffer),
      );

      // fs.writeFileSync(
      //   `./images/${title}/${fileName}`,
      //   Buffer.from(imageBuffer),
      // );
    }
  }

  async run() {
    this.browser = await getBrowser(false);

    // get insta post by supabase Service
    const instaPosts = await this.supabaseService.getInstaPosts();
    console.log(instaPosts);

    for await (const instaPost of instaPosts) {
      const page = await this.browser.newPage();
      await page.goto(instaPost.link, { waitUntil: WAIT_UNTIL_NETWOKR_IDLE_2 });
      await this.getDownloadContents(page, instaPost);
      // update insta post table
      await this.supabaseService.updateInstaPostDone(instaPost.id);
      // sleep random from 5 seconds to 10 seconds
      const sleepTime = Math.floor(Math.random() * 5000) + 5000;
      await sleep(sleepTime);
      await page.close();
    }

    await this.browser.close();
  }

  async createThumbnail(title: string) {
    const baseImagePath = './images/base.png';
    const outputPath = './images/thumbnail.png';
    const fontSize = 120;
    const fontColor = 'white';
    const fontFamily = 'JejuHallasan-Regular'; // 사용자 정의 폰트 경로로 변경 가능

    // 사용자 정의 폰트 등록 (사용자 정의 폰트 사용 시 경로 지정)
    registerFont('./fonts/JejuHallasan-Regular.ttf', { family: fontFamily });

    // 이미지 로드
    const img = await loadImage(baseImagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // 이미지를 캔버스에 그리기
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // 텍스트 설정
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 텍스트를 여러 줄로 나누기
    const lines = title.split('\n');
    const lineHeight = fontSize * 1.2; // 줄 간격 설정
    const totalHeight = lineHeight * lines.length;

    // 텍스트의 시작 y 위치 계산
    let startY = (img.height - totalHeight) / 2 + lineHeight / 2;

    // 각 줄을 중앙에 그리기
    lines.forEach((line) => {
      ctx.fillText(line, img.width / 2, startY);
      startY += lineHeight;
    });

    // 캔버스를 이미지 버퍼로 변환
    const buffer = canvas.toBuffer('image/png');
    return buffer;

    // 최종 이미지 저장
    // await sharp(buffer).toFile(outputPath);
  }
}

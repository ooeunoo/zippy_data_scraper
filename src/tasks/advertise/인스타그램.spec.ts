import { Test, TestingModule } from '@nestjs/testing';
import { 인스타그램 } from './인스타그램';
import { Browser, Page } from 'puppeteer';
import { getBrowser } from '../task.utils';

describe('인스타그램 클래스', () => {
  let service: 인스타그램;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [인스타그램],
    }).compile();

    service = module.get<인스타그램>(인스타그램);
  });

  it('run 메소드가 정상적으로 실행되는지 테스트', async () => {
    const channel = 'suuu_yeony';
    const logSpy = jest.spyOn(console, 'log');

    await service.run(channel);

    expect(logSpy).toHaveBeenCalled();
  });
});

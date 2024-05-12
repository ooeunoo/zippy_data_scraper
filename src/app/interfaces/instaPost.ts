// insta post interface (title: string, link: string, done: boolean)
export interface IInstaPost {
  id: number;
  title: string;
  link: string;
  done: boolean; // 데이터를 스토리지에 저장했냐
  upload: boolean; // 인스타에 업로드를 했냐
}

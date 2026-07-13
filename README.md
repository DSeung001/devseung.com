# DevSeung Static Portal

`devseung.com` 루트 도메인에서 운영되는 DevSeung 서비스 소개용 정적 사이트입니다.

## 구성

- 순수 HTML/CSS/JS
- 다국어: `ko`, `en`, `ja`, `zh-CN`
- 페이지:
  - `/`
  - `/about`
  - `/projects`
  - `/projects/date-invite`
  - `/projects/class-s`
  - `/faq`
  - `/privacy`
  - `/terms`
  - `/contact`
  - `/404.html`

## 로컬 확인

정적 파일 서버로 루트를 서빙하면 됩니다.

예시:

```bash
python3 -m http.server 8080
```

## GitHub Pages 배포

1. 저장소 **Settings → Pages** 진입
2. Build and deployment source를 **Deploy from a branch**로 설정
3. Branch를 `main` / `(root)`로 선택
4. Custom domain에 `devseung.com` 입력
5. DNS(CNAME) 설정 완료 후 **Enforce HTTPS** 활성화

## 문의/FAQ 이슈 연동

FAQ 및 Contact 페이지는 GitHub 이슈 생성 링크를 포함합니다.
- 저장소: `https://github.com/DSeung001/devseung.com`
- 링크는 제목/본문이 자동으로 채워지도록 구성되어 있습니다.

# СОК — GitHub + Netlify + админ-панель

Это обычный статический сайт, но контент редактируется через Decap CMS по адресу:

`https://ВАШ-САЙТ.netlify.app/admin/`

Из админки можно менять:
- заголовки и тексты;
- зелёные цвета;
- два фото на первом экране;
- портфолио: добавлять, удалять, менять фото, категории и размер карточек;
- направления и этапы работы;
- цены — калькулятор берёт их автоматически;
- контакты и ссылки.

## 1. Создайте репозиторий на GitHub

Создайте пустой репозиторий, например `sok-site`, и загрузите в него ВСЕ файлы из этой папки.
Ветка должна называться `main`.

## 2. Укажите репозиторий в админке

Откройте `admin/config.yml` и замените:

`repo: YOUR_GITHUB_USERNAME/YOUR_REPOSITORY`

например на:

`repo: bob/sok-site`

Сохраните и отправьте изменение в GitHub.

## 3. Подключите GitHub-репозиторий к Netlify

В Netlify создайте новый Project → Import an existing project → GitHub → выберите ваш репозиторий.
Build command оставьте пустым. Publish directory: `.`

В проекте уже есть `netlify.toml`, поэтому обычно Netlify подхватит publish автоматически.

После первого деплоя вы получите адрес вроде:
`https://sok-studio.netlify.app`

## 4. Создайте GitHub OAuth App для входа в /admin

GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.

Homepage URL:
`https://ВАШ-САЙТ.netlify.app`

Authorization callback URL:
`https://api.netlify.com/auth/done`

После создания GitHub покажет Client ID. Создайте Client Secret и сохраните оба значения.

## 5. Добавьте GitHub OAuth в Netlify

В Netlify откройте ваш Project → Project configuration → Access & security → OAuth → Authentication providers.
Добавьте GitHub и вставьте Client ID + Client Secret из предыдущего шага.

## 6. Готово

Откройте:
`https://ВАШ-САЙТ.netlify.app/admin/`

Нажмите вход через GitHub. У вашего GitHub-аккаунта должен быть push-доступ к репозиторию.

Когда вы нажимаете Publish в админке:
1. Decap CMS меняет `content/site.json` и/или загружает фото в `assets/uploads`;
2. создаётся commit в GitHub;
3. Netlify автоматически видит commit;
4. сайт обновляется.

Обычно это занимает от нескольких секунд до пары минут.

## Где лежит контент

`content/site.json` — почти всё, что меняется через админку.

`assets/uploads/` — изображения, загруженные через админку.

`styles.css` — сложный дизайн, обычно трогать не надо.

`app.js` — функционал, фильтры, калькулятор, меню, галерея.

## Важно

Старые фотографии в стартовом контенте пока ссылаются на CDN старого Tilda-сайта. Когда загрузите свои фото через `/admin/`, новые изображения будут сохраняться прямо в GitHub-репозиторий в `assets/uploads`, и зависимость от Tilda можно будет полностью убрать.

## Быстрый старт

1. **Клонируйте репозиторий и перейдите в папку проекта:**
   ```sh
   git clone https://github.com/froonn/interactive-discrete-math-backend.git
   cd interactive-discrete-math-backend
   ```

2. **Установите зависимости:**
   ```sh
   npm install
   ```

3. **Создайте `.env` файл и задайте переменные окружения:**
   Пример содержимого файла:
   ```
    VITE_MACHINE_PORT=8090
    PORT=3001
    SECRET_KEY=SECRET_KEY
    NODE_ENV=dev
   ```
   Настройте значения по вашему усмотрению.

4. **Запуск в режиме разработки:**
   ```sh
   npm run dev
   ```
   Сервер автоматически перезапускается при изменениях.

5. **Сборка и запуск в production:**
   ```sh
   npm run build
   npm start
   ```

## Сценарии

- `npm run dev` — запуск разработки на основе `nodemon` и TypeScript
- `npm run build` — сборка TypeScript в JavaScript (в папку `dist`)
- `npm start` — запуск production-сервера на Node.js из папки `dist`

# CleanOps Staff Mobile

Staff-only Expo app for:

- staff login
- attendance check-in/check-out with image + location
- viewing today's task instances
- QR-based task start
- proof-image task completion

## Setup

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_BASE_URL`.
3. Run `npm install`.
4. Start the backend.
5. Run either `npm run android` or `npm run web`.

## Run On Android

```bash
cd /home/shumail/FYP/backend
npm run dev
```

In a second terminal:

```bash
cd /home/shumail/FYP/frontend-mobile
npm run android
```

## Run On Web

```bash
cd /home/shumail/FYP/backend
npm run dev
```

In a second terminal:

```bash
cd /home/shumail/FYP/frontend-mobile
npm run web
```

Expo web usually opens on `http://localhost:8081`.

## Run On Web From Another Phone On The Same Wi-Fi

```bash
cd /home/shumail/FYP/backend
npm run dev
```

In a second terminal:

```bash
cd /home/shumail/FYP/frontend-mobile
npm run web:lan
```

Then open the Expo web LAN URL on the phone browser, typically:

```text
http://192.168.1.26:8081
```

Important for web:

- your backend `FRONTEND_URL` must allow the Expo web origin
- if Expo web is running on `http://localhost:8081`, set backend `FRONTEND_URL=http://localhost:8081,http://localhost:5173`
- restart the backend after changing `FRONTEND_URL`
- backend CORS now also allows localhost, `127.0.0.1`, and private-network origins automatically in non-production

## API base URL

- Android emulator: `http://10.0.2.2:8080/api`
- Physical device: use your laptop LAN IP, for example `http://192.168.1.10:8080/api`
- Web in the same laptop browser: `http://localhost:8080/api`
- Web opened from another phone browser on the same Wi-Fi: `http://192.168.1.26:8080/api`

## Current Local Example

Your current phone-testing `.env` is using:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.26:8080/api
```

If you want to run the app on web in your laptop browser instead, change it to:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Then restart Expo.

## Web Notes

- login, task list, and API flows work on web
- camera and location behavior depend on browser permissions
- QR scanning on web may be less reliable than Android native
- for best results on web, use Chrome and allow camera/location access
- when opening the web app from another phone browser, keep `EXPO_PUBLIC_API_BASE_URL` pointed at the laptop LAN IP

## Backend expectations

- `POST /staff/staff-login` returns `accessToken` and `refreshToken` in response data
- `POST /common/refresh-token` accepts `refreshToken` in request body
- auth endpoints also continue setting cookies for the existing web frontend

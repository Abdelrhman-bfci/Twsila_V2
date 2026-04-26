# Twsila V2

> Reimagined ride-sharing for Egyptian commuters and students.
> Built on the same React Native / Expo / Supabase stack as Twsila V1, with a brand-new "Academic Transit Modern" design system and a complete redesign of the trip lifecycle around **Managed Trips** and **Captain Bidding**.

## ✨ What's new in V2

| Concept                | V1 (Twsila)                    | V2 (Twsila V2)                                                                  |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Trip ownership         | Created by an admin/operator  | **Created by any passenger** — they become the *Trip Admin* / moderator           |
| Schedule               | Single-day per trip            | **Recurring days-of-week**, extendable any time                                   |
| Pricing                | Fixed per trip                 | **Per-passenger, per-day, distance-based** rates set by the Trip Admin            |
| Driver assignment      | Direct booking                 | **Captains submit bids with comments** to a marketplace; Admin picks the winner   |
| Confirmation           | Single booking                 | **Daily attendance confirmation** before departure to lock in pricing             |
| Languages              | AR + EN                        | AR + EN (full RTL)                                                                |

## 🧭 Core flows

### Passenger
1. **Login / Sign up** (passenger or captain).
2. **Search** an existing trip by start + end point.
3. **Book** an existing trip and **confirm attendance** for each scheduled day.
4. If no suitable trip exists → **Create a Managed Trip** (becomes Trip Admin).

### Trip Admin (passenger creator)
* Define start, end, and ordered intermediate stops.
* Pick days-of-week and an active window. **Extend later** at any time.
* Set per-passenger price-per-day based on distance.
* **Review captain bids** (price + comment) and accept the winning offer.

### Captain
1. Login.
2. Browse the **Marketplace** of managed trips, **filter by route**.
3. **Submit a bid** with price-per-trip and an optional comment.
4. Track bid status under **My Bids**.

## 🛠 Tech stack

* **Expo SDK 54** · React Native 0.81 · React 19 · Hermes
* **TypeScript (strict)** with feature-based clean architecture
* **React Navigation v7** (native-stack + bottom-tabs)
* **i18next + expo-localization** with full RTL support
* **Supabase** (Auth + Postgres + Realtime + RLS)
* **AsyncStorage** for session persistence
* `babel-plugin-module-resolver` for `@core / @features / @shared / @navigation` aliases

## 📂 Project structure

```
Twsila_V2/
├── App.tsx
├── app.json / eas.json / babel.config.js / tsconfig.json
├── assets/
│   ├── fonts/README.md          # drop Cairo TTFs here (optional)
│   └── icon.png / splash.png / adaptive-icon.png
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── src/
    ├── core/
    │   ├── config/    (devMode, supabase client)
    │   ├── constants/
    │   ├── data/      (in-memory dummy store for dev mode)
    │   ├── i18n/      (en.json + ar.json)
    │   ├── theme/     (Indigo/Cairo design tokens)
    │   └── utils/
    ├── features/
    │   ├── auth/        (data, domain, presentation)
    │   ├── captain/     (marketplace, submit bid, my bids)
    │   ├── offers/      (admin reviews bids)
    │   ├── profile/
    │   └── trips/       (search, create, details, attendance, pricing)
    ├── navigation/      (Auth, Passenger, Captain navigators)
    └── shared/components/  (Button, Input, Card, RouteTimeline, DayChip, …)
```

## 🚀 Getting started

```bash
# 1. install
cd Twsila_V2
npm install

# 2. configure environment
cp .env.example .env
# edit .env -> set your Supabase URL and anon key OR keep DEV_MODE=true

# 3. run
npm run start          # offline (recommended)
npm run android        # boot to a connected device / emulator
npm run ios            # macOS only
```

> 💡 **Dev Mode (default).** With `EXPO_PUBLIC_DEV_MODE=true`, the app runs entirely against in-memory dummy data. No Supabase needed. Quick-login buttons are shown on the login screen — pick a test passenger or captain.

### Test accounts (dev mode)

| Role | Phone | Password |
| --- | --- | --- |
| Passenger (Yara) | `+201111111111` | `twsila123` |
| Passenger (Omar) | `+201222222222` | `twsila123` |
| Captain (Ahmed)  | `+201333333333` | `twsila123` |
| Captain (Mahmoud)| `+201444444444` | `twsila123` |

## 🗄 Supabase setup

1. Create a Supabase project.
2. Run the schema once:
   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/migrations/001_initial_schema.sql
   ```
   or paste the SQL directly into the Supabase SQL editor.
3. Copy your project URL and anon key into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
   EXPO_PUBLIC_DEV_MODE=false
   ```

The schema contains:
* `users`, `captains` — profile tables (passenger + captain roles).
* `trips` — managed trips owned by an `admin_id`.
* `trip_stops` — ordered intermediate stations.
* `trip_schedule_days` — days-of-week the trip operates on.
* `trip_passengers` — who has joined which trip (with the admin flag).
* `trip_passenger_pricing` — per-passenger, per-day distance-based prices.
* `trip_attendance` — daily confirmation rows (locks the price for that date).
* `captain_offers` — bids a captain submits, with comment.
* RPC functions: `extend_trip_schedule`, `confirm_attendance`, `cancel_attendance`, `set_passenger_daily_price`, `accept_captain_offer`, `reject_captain_offer`.
* Comprehensive **Row-Level Security** for every table.
* Realtime publications for trips, passengers, attendance, pricing, offers.

## 🎨 Design system

Tokens live under `src/core/theme/`:

| Token            | Value                                    |
| ---------------- | ---------------------------------------- |
| Primary          | Indigo Blue `#1F108E` / `#3730A3`        |
| Secondary        | Emerald Green `#006C4A` / `#82F5C1`      |
| Surface          | Soft cool gray `#F9F9FF`                 |
| Font family      | **Cairo** (drop into `assets/fonts/`)    |
| Spacing rhythm   | 8 px (`xxs … xxxl`)                      |
| Corner radii     | 4 / 8 / 12 / 16 / 20 / 28 / pill         |
| Shadow palette   | Indigo-tinted (subtle / card / elevated) |

The design follows the HTML mock-ups in `design/`, including:
* `twsila_login`, `twsila_sign_up_passenger`
* `passenger_search_results`, `passenger_trip_details`
* `daily_attendance_dashboard`
* `admin_trip_logistics_updated`, `admin_bid_seat_pricing`
* `captain_marketplace_bidding`

## 🌍 i18n

* English: `src/core/i18n/locales/en.json`
* Arabic: `src/core/i18n/locales/ar.json`
* Default language picks the device locale; falls back to Arabic.
* Switching languages from the Profile screen forces RTL/LTR via `I18nManager`.

## 📦 Build

```bash
# preview APK (requires EAS configuration)
npm run build:apk

# production AAB
npm run build:android
```

## 📜 License

Internal Twsila project.

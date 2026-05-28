# Small Steps Diet Assistant

A simple phone-friendly weight-loss helper for small daily actions, stress-eating pauses, meal notes, weight tracking, and AI-coach prompts.

## What it does

- Tracks your current weight, goal weight, and next small milestone.
- Lets you log meals, stress urges, and daily habit wins.
- Creates a copy-ready prompt for free AI tools like Gemini, ChatGPT, or Claude.
- Saves your entries in your own browser on your device.
- Works as a free static website on GitHub Pages.

## How to put it on GitHub Pages

1. Go to [github.com](https://github.com/) and create a free account.
2. Click **New repository**.
3. Name it something like `small-steps-diet-assistant`.
4. Make it **Public** if you want to use GitHub Pages on the free plan.
5. Upload these files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `firebase-config.js`
   - `manifest.webmanifest`
   - `README.md`
6. Open the repository’s **Settings**.
7. Open **Pages** in the left menu.
8. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
9. Click **Save**.

GitHub may take a few minutes to publish it. Your link will look like:

```text
https://YOUR-GITHUB-USERNAME.github.io/small-steps-diet-assistant/
```

## Privacy note

This first version stores data in the browser on the device where you use it. If you open it on another phone or computer, that device will have its own separate saved entries.

Do not use this as medical advice. If you have a medical condition, take medication, are pregnant, have severe symptoms, or struggle with disordered eating, talk with a qualified clinician.

## How to update GitHub after changes

When you change the app on your computer, update GitHub like this:

1. Open your GitHub repository.
2. Click **Add file**.
3. Click **Upload files**.
4. Drag in the updated files.
5. If GitHub asks, choose **Replace** for files that already exist.
6. Scroll down and click **Commit changes**.

For this Firebase sync update, upload these files:

- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`
- `README.md`

GitHub Pages usually refreshes within a few minutes.

## Firebase sync setup

Firebase is the free cloud part that lets your phone and computer share the same logs.

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**.
3. Give it a name like `Small Steps Diet Assistant`.
4. You can turn off Google Analytics for this simple app.
5. Finish creating the project.

### 2. Add a web app

1. In Firebase, click the web icon: `</>`.
2. App nickname: `Small Steps Web`.
3. You do not need Firebase Hosting.
4. Firebase will show you a `firebaseConfig` object.
5. Copy the values into `firebase-config.js`.

Firebase says web apps use a Firebase config object, and Firebase API keys are okay to include in client app code when used with Firebase services. Your privacy comes from Google sign-in plus Firestore security rules, not from hiding this config.

### 3. Turn on Google sign-in

1. In Firebase, open **Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Google**.
5. Add your support email if Firebase asks.
6. Save.

### 4. Add your GitHub Pages domain

1. In Firebase, open **Authentication**.
2. Open **Settings**.
3. Find **Authorized domains**.
4. Add your GitHub Pages domain:

```text
YOUR-GITHUB-USERNAME.github.io
```

### 5. Create Firestore

1. In Firebase, open **Firestore Database**.
2. Click **Create database**.
3. Start in production mode.
4. Pick the closest location.

### 6. Add Firestore rules

In **Firestore Database** → **Rules**, replace the rules with:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/app/state {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

### 7. Update GitHub again

After editing `firebase-config.js`, upload it to GitHub again. Then open your GitHub Pages app and click **Sign in with Google**.

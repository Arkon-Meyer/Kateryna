# Kateryna

## Deploy on GitHub Pages

This repository is configured to deploy automatically to GitHub Pages using GitHub Actions.

### One-time setup in GitHub

1. Open the repository on GitHub.
2. Go to **Settings** -> **Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Save.

After this one-time setup, every push to `main` will trigger the Pages deployment workflow.

### How to verify deployment

1. Open the **Actions** tab.
2. Wait for **Deploy static site to GitHub Pages** to finish successfully.
3. Open the Pages URL shown in **Settings** -> **Pages** (or in the workflow summary).
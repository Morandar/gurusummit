# O2 Guru Summit 2025 - Gamified Hub

## Project info

**Repository**: https://github.com/Morandar/gurusummit
**Live URL**: Deployed on Vercel

## How can I edit this code?

There are several ways of editing your application.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will automatically trigger deployment on Vercel.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library with hooks
- **shadcn-ui** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a service (database, auth, real-time)
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Capacitor** - Cross-platform mobile app development

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Admin and user dashboards
│   ├── Modals/         # Modal dialogs
│   ├── Profile/        # User profile components
│   └── ui/             # shadcn-ui components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Page components
└── assets/             # Static assets
```

## How can I deploy this project?

This project is automatically deployed on Vercel when changes are pushed to the main branch on GitHub.

### Manual Deployment

If you need to deploy manually:

1. Connect your GitHub repository to Vercel
2. Push changes to the main branch
3. Vercel will automatically build and deploy the application

### Environment Variables

Make sure to set the following environment variables in Vercel:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Can I connect a custom domain?

Yes, you can connect a custom domain to your Vercel deployment!

### Connecting a Custom Domain on Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Domains
4. Click "Add" and enter your custom domain
5. Follow Vercel's instructions to configure DNS settings

### Environment Variables

Make sure to set the following environment variables in Vercel:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Read more in the [Vercel documentation](https://vercel.com/docs/concepts/projects/domains/add-a-domain)

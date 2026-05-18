# Brady Legler

A Next.js e-commerce website integrated with Sanity CMS for content management and Shopify for e-commerce functionality.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **CMS:** Sanity v3
- **E-commerce:** Shopify (Headless)
- **Styling:** Styled Components, SASS
- **Language:** TypeScript
- **Package Manager:** Yarn 4.1.1
- **UI Components:** Storybook
- **Forms:** React Hook Form
- **State Management:** Zustand

## Prerequisites

- Node.js v24.1.0 or higher
- Yarn 4.1.1
- Access to Sanity project
- Access to Shopify store (bradylegler)

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:Woolly-Mammoth/bradylegler.git
cd bradylegler
```

### 2. Set Up Environment Variables

Duplicate the `.env.template` file and rename it to `.env.development`:

```bash
cp .env.template .env.development
```

Update the following required variables in `.env.development`:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Your Sanity project ID
- `NEXT_PUBLIC_SANITY_PROJECT_NAME` - Your Sanity project name
- `SANITY_API_READ_TOKEN` - Sanity API read token (Viewer permissions)
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Shopify Storefront API access token

### 3. Set Up Sanity CMS

1. Go to [Sanity](https://www.sanity.io/manage) and create a new project
2. Note your Project ID and update `NEXT_PUBLIC_SANITY_PROJECT_ID`
3. In your Sanity project settings, go to the **API** tab:
   - Add CORS origin: `http://localhost:3000` with credentials enabled
   - Create an API token with **Viewer** permissions
   - Update `SANITY_API_READ_TOKEN` with the token

### 4. Install Dependencies

```bash
yarn install
```

### 5. Run Development Server

```bash
yarn dev
```

The application will be available at:

- **Website:** http://localhost:3000
- **Sanity Studio:** http://localhost:3000/studio

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── (pages)/           # Page routes
│   ├── api/               # API endpoints
│   └── studio/            # Sanity Studio
├── components/            # React components
├── sections/              # Page section components
├── templates/             # Page templates
├── config/                # Configuration files
├── tools/                 # Utilities and tools
│   └── storybook/        # Storybook configuration
├── assets/                # Static assets
├── public/                # Public files
└── .env.template          # Environment variable template
```

## Available Scripts

```bash
# Development
yarn dev                   # Start development server
yarn build                 # Build for production
yarn start                 # Start production server

# Code Quality
yarn lint                  # Run ESLint
yarn lint:all              # Lint all files
yarn lint:fix              # Fix ESLint errors
yarn prettier              # Check code formatting
yarn prettier:fix          # Fix code formatting
yarn ts:watch              # Run TypeScript compiler in watch mode

# Storybook
yarn storybook             # Start Storybook on port 3001
yarn storybook:build       # Build Storybook
```

## Environment Variables

### Required for Core Functionality

| Variable                                      | Description                                |
| --------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`               | Sanity project ID                          |
| `NEXT_PUBLIC_SANITY_PROJECT_NAME`             | Sanity project name                        |
| `SANITY_API_READ_TOKEN`                       | Sanity API read token (Viewer permissions) |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify Storefront API access token        |

### Pre-configured (Non-sensitive)

| Variable                                 | Default Value                                                | Description              |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| `NEXT_PUBLIC_SITE_URL`                   | `https://bradylegler.netlify.app`                            | Production site URL      |
| `NEXT_PUBLIC_SANITY_DATASET`             | `production`                                                 | Sanity dataset name      |
| `NEXT_PUBLIC_SANITY_API_VERSION`         | `2021-03-25`                                                 | Sanity API version       |
| `SHOPIFY_STORE_ID`                       | `bradylegler`                                                | Shopify store identifier |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_URL` | `https://bradylegler.myshopify.com/api/2023-01/graphql.json` | Shopify GraphQL endpoint |

### Optional - Sanity

| Variable                           | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `SANITY_WRITE_TOKEN`               | Sanity API write token (required for updating content via API) |
| `SANITY_STUDIO_NETLIFY_BUILD_HOOK` | Netlify build webhook URL for rebuilding from Sanity Studio    |

### Optional - Email & Marketing

| Variable                       | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `RESEND_API_KEY`               | Resend API key for transactional emails      |
| `FORM_ENQUIRY_EMAIL_RECIPIENT` | Email address to receive form enquiries      |
| `KLAVIYO_PRIVATE_API_KEY`      | Klaviyo API key for email marketing          |
| `KLAVIYO_LIST_ID`              | Klaviyo list ID for newsletter subscriptions |

### Optional - Analytics & Tracking

| Variable                            | Description                     |
| ----------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Google Tag Manager container ID |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`   | Google Analytics measurement ID |
| `NEXT_PUBLIC_HUBSPOT_ID`            | HubSpot tracking ID             |
| `NEXT_PUBLIC_SEGMENT_ID`            | Segment write key               |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`     | Facebook Pixel ID               |
| `NEXT_PUBLIC_HOTJAR_ID`             | Hotjar site ID                  |

### Optional - Other Integrations

| Variable                     | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_OKENDO_USER_ID` | Okendo user ID (for product reviews)                         |
| `NEXT_PUBLIC_IS_STAGING`     | Set to `"true"` on staging to prevent search engine indexing |

Note: to use the staging Sanity dataset, set `NEXT_PUBLIC_SANITY_DATASET="staging"` in the staging environment.

## Third-Party Integrations

### Sanity CMS

- **Purpose:** Content management system
- **Studio Access:** `/studio` route
- **Plugins:**
  - Color Input
  - Table
  - Unsplash Asset Source
  - Icon Manager
  - Media Library
  - Tags

### Shopify

- **Purpose:** E-commerce platform
- **Store:** bradylegler.myshopify.com
- **Integration:** Headless commerce via Storefront API

### Analytics & Tracking

- Google Tag Manager
- Google Analytics
- HubSpot
- Segment
- Facebook Pixel
- Hotjar

### Email & Marketing

- **Resend** - Transactional emails
- **Klaviyo** - Email marketing and newsletter subscriptions

### Product Reviews

- **Okendo** - Product reviews and ratings (optional)

## Development Guidelines

### Code Style

- ESLint and Prettier are configured
- Run `yarn lint:fix` and `yarn prettier:fix` before committing
- TypeScript strict mode enabled

### Component Development

- Use Storybook for component development and documentation
- Run `yarn storybook` to view component library
- Components are located in `/components` directory

### Git Workflow

- Main branch: `main`
- Create feature branches for new work
- Ensure builds pass before merging

## Deployment

### Build Commands

```bash
yarn build                 # Production build
yarn start                 # Serve production build
```

### Hosting

The site can be deployed to any platform that supports Next.js:

- Netlify
- Vercel
- Other Node.js hosting platforms

Ensure all environment variables are configured in your hosting platform's settings.

## Sanity Studio Deployment

To deploy Sanity Studio separately (if needed):

```bash
npx sanity deploy
```

## Recent Changes

- Fixed discover more logic
- Fixed featured media logic
- Wrapped product and collection slugs in forward slashes
- Fixed product revalidation
- Added logging to revalidate endpoint

## Support & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Styled Components](https://styled-components.com/docs)

## License

Private - All rights reserved

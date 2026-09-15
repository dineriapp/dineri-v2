FROM node:22.20.0-slim

WORKDIR /app

# Enable pnpm 11.15.0
RUN corepack enable && corepack prepare pnpm@11.15.0 --activate

# Copy dependency files first for Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
# Disable Husky because .git is not available inside the image
RUN HUSKY=0 pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build Next.js application
RUN pnpm run build

EXPOSE 3000

# Push database schema before starting Next.js
CMD ["sh", "-c", "pnpm db:push && pnpm start"]
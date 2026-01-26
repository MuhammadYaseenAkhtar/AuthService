# =============== Multi-step build process ==================

# ---------- FIRST STEP -------------------

# Use the official Node.js image AS our bASe
FROM node:24-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# ci = Continuous Integration; “Install dependencies exactly AS locked, starting from a clean slate.”
RUN npm ci

# Copy the rest of our app's source code into the container
COPY . .

# Running build command and a dist folder will be generated.
RUN npm run build


# ---------- SECOND STEP -------------------


FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

# No third party script run during installation; It will install only production dependencies; No dev ones;
RUN npm ci --omit=dev --ignore-scripts

# Copy only dist folder
COPY --from=builder /app/dist ./dist

EXPOSE 1717

# This command will run when the container starts
CMD ["node", "dist/server.js"]

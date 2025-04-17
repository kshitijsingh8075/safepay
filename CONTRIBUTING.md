# Contributing to UPI Secure

Thank you for your interest in contributing to UPI Secure! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** and clone it to your local machine.
2. **Set up your development environment** by following the instructions in the README.md file.
3. **Create a new branch** for your feature or bug fix:
   ```
   git checkout -b feature/your-feature-name
   ```

## Environment Setup

1. Copy `.env.example` to `.env` and fill in the required variables:
   ```
   cp .env.example .env
   ```
2. Make sure you have the following environment variables set:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SESSION_SECRET`: A secure random string
   - `PORT`: 5001 (default)

## Development Workflow

1. **Make your changes** in your feature branch.
2. **Write tests** for your changes when applicable.
3. **Run the test suite** to ensure your changes don't break existing functionality:
   ```
   npm test
   ```
4. **Format your code** using the project's formatting rules:
   ```
   npm run format
   ```
5. **Commit your changes** with a clear and descriptive commit message:
   ```
   git commit -m "Add feature: your feature description"
   ```

## Pull Request Process

1. **Push your changes** to your fork:
   ```
   git push origin feature/your-feature-name
   ```
2. **Create a pull request** against the main repository's `main` branch.
3. **Describe your changes** in the pull request description, including:
   - The purpose of the changes
   - How to test the changes
   - Any relevant screenshots or demos
4. **Address any review comments** and make the necessary changes.
5. **Wait for approval** from the maintainers before merging.

## Code Style Guidelines

- Follow the existing code style used in the project.
- Use meaningful variable and function names.
- Add comments for complex logic.
- Keep functions small and focused on a single responsibility.
- Ensure all TypeScript files pass the linting checks.

## Working with TypeScript

- Maintain type safety throughout the codebase.
- Define interfaces for complex data structures.
- Avoid using `any` type unless absolutely necessary.
- Note that `server/vite.ts` is excluded from strict TypeScript checks due to compatibility issues.

## Working with the Database

- Use Drizzle ORM for database operations.
- Add new schema definitions in `shared/schema.ts`.
- Run `npm run db:push` to apply schema changes to the database.
- Do not use raw SQL queries unless absolutely necessary.

## Thank You!

Your contributions are greatly appreciated and help make UPI Secure better for everyone!
# Contributing to TaskManager

Thank you for your interest in contributing to TaskManager! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and professional in all interactions.

## Getting Started

1. **Fork the repository**
   ```bash
   gh repo fork your-username/taskmanager
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/taskmanager.git
   cd taskmanager
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

## Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in PR template

## Pull Request Process

1. **Before submitting:**
   - Ensure all tests pass
   - Update documentation if needed
   - Follow coding standards
   - Rebase on latest main branch

2. **PR Requirements:**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - No merge conflicts

3. **Review Process:**
   - At least one approval required
   - CI checks must pass
   - Address reviewer feedback

4. **After merge:**
   - Delete your branch
   - Update your fork

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Provide proper types (no `any`)
- Use interfaces for object shapes

### React Components

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Proper prop types

### File Naming

- `PascalCase` for components: `Button.tsx`
- `camelCase` for utilities: `formatDate.ts`
- `kebab-case` for CSS: `styles.module.css`

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings

### Example

```typescript
// Good
interface UserProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserProps) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// Bad
export function UserCard(props: any) {
  return <div><h3>{props.name}</h3></div>
}
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add password reset functionality

Implement password reset flow with email verification.
- Add reset password API endpoint
- Create reset password page
- Send email with reset link

Closes #123
```

```bash
fix(tasks): resolve kanban drag-and-drop issue

Fixed bug where tasks would not update position after drag.

Fixes #456
```

```bash
docs(readme): update installation instructions

Added PostgreSQL setup steps and troubleshooting section.
```

## Areas for Contribution

### High Priority

- [ ] Add unit tests for API routes
- [ ] Improve mobile responsiveness
- [ ] Add real-time notifications
- [ ] Implement file uploads
- [ ] Add dark mode support

### Good First Issues

- [ ] Fix typos in documentation
- [ ] Add missing error messages
- [ ] Improve UI accessibility
- [ ] Add loading states
- [ ] Update dependencies

### Feature Requests

Check the [Issues](https://github.com/your-username/taskmanager/issues) page for feature requests and bugs.

## Development Tips

### Database Changes

When modifying the database schema:

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Update seed data if needed
4. Test migration on fresh database

### API Endpoints

When adding new API routes:

1. Create route in `app/api/`
2. Add Zod validation schema
3. Implement permission checks
4. Add error handling
5. Update API documentation

### UI Components

When creating new components:

1. Create in appropriate folder (`ui`, `layout`, `features`)
2. Add TypeScript interfaces
3. Use Tailwind classes
4. Make it responsive
5. Document props

## Testing

### Manual Testing

1. Test all CRUD operations
2. Verify permission checks
3. Test edge cases
4. Check mobile responsiveness
5. Test in different browsers

### Automated Testing (Future)

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Documentation

### Code Comments

- Add JSDoc comments for functions
- Explain complex logic
- Document edge cases

### README Updates

- Keep README.md current
- Update feature list
- Add new setup steps
- Update screenshots

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Check existing issues first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TaskManager! 🎉

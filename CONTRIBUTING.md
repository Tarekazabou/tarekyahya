# Contributing to Primavet

Thank you for your interest in contributing to the Primavet website project!

## Development Setup

### Prerequisites

- Node.js 14.0.0 or higher
- A modern web browser
- Git
- Supabase account (for database features)

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tarekazabou/tarekyahya.git
   cd tarekyahya
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL scripts in `database/` directory
   - Update `js/supabase-client.js` with your credentials

4. **Start development server:**
   ```bash
   npm run dev
   ```
   This opens the site at `http://localhost:8080`

## Project Structure

```
tarekyahya/
├── index.html              # Home page
├── about.html              # About page
├── products.html           # Products catalog
├── collections.html        # Collections with filtering
├── showroom.html           # Gallery/Showroom
├── news.html               # News/Blog
├── recruitment.html        # Job listings
├── contact.html            # Contact form
├── quote.html              # Quote request form
├── suggestion.html         # Suggestion box
├── login.html              # Admin login
├── auth.html               # Authentication page
├── espace_admin.html       # Admin dashboard
│
├── css/
│   ├── styles.css          # Main styles
│   ├── admin.css           # Admin dashboard styles
│   ├── collections.css     # Collections page styles
│   └── restricted-content.css
│
├── js/
│   ├── main.js             # Main site functionality
│   ├── supabase-client.js  # Supabase configuration
│   ├── data-service.js     # Data layer (CRUD operations)
│   ├── admin.js            # Admin dashboard logic
│   ├── admin-users.js      # User management
│   ├── form-handler.js     # Form validation & handling
│   ├── page-renderers.js   # Dynamic page rendering
│   ├── collections-page.js # Collections filtering
│   ├── content-restriction.js # Content access control
│   └── visitor-tracker.js  # Analytics tracking
│
├── database/
│   ├── README.md           # Database documentation
│   ├── schema.sql          # Main database schema
│   └── [other SQL files]   # Optional features
│
├── assets/                 # Images and media
└── scripts/                # Utility scripts
```

## Coding Standards

### JavaScript

- Use ES6+ features
- Follow ESLint configuration
- Keep console.error and console.warn for error tracking
- Avoid console.log in production code
- Use meaningful variable and function names
- Add comments for complex logic

### HTML

- Use semantic HTML5 elements
- Include proper meta tags for SEO
- Ensure accessibility (ARIA labels, alt text)
- Keep consistent indentation (2 spaces)

### CSS

- Follow BEM naming convention where appropriate
- Use CSS variables for colors and common values
- Keep responsive design in mind (mobile-first)
- Group related styles together
- Add comments for complex selectors

### Code Formatting

Before committing, run:
```bash
npm run format        # Auto-format all files
npm run lint:fix      # Fix linting issues
npm run validate      # Check formatting and linting
```

## Git Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clean, tested code
   - Follow coding standards
   - Update documentation if needed

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   
   Use conventional commit messages:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting)
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

4. **Push and create a Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] All pages load without errors
- [ ] Forms submit correctly
- [ ] Responsive design on mobile, tablet, desktop
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Navigation works on all pages
- [ ] Admin dashboard (if modified)
- [ ] Database operations (if modified)

### Browser Console

Check for:
- No JavaScript errors
- No console.error messages (expected ones are OK)
- No 404 errors for resources

## Common Tasks

### Adding a New Page

1. Create `new-page.html` based on existing pages
2. Include standard header/footer
3. Link CSS and JS files
4. Update navigation menus
5. Add to documentation

### Adding a New Form

1. Add HTML form structure
2. Use FormHandler for validation
3. Create backend endpoint in Supabase
4. Add success/error feedback
5. Test all fields and validations

### Modifying Database Schema

1. Create SQL migration file in `database/`
2. Test in development Supabase project
3. Document changes in database/README.md
4. Update data-service.js if needed

### Optimizing Images

```bash
# Reduce image sizes (use online tools or CLI)
# Recommended: TinyPNG, ImageOptim, or Squoosh
# Keep originals in a backup folder
# Target: <200KB for photos, <50KB for logos
```

## Performance Guidelines

- Minimize HTTP requests
- Compress images before upload
- Use lazy loading for images
- Minimize and concatenate CSS/JS for production
- Enable browser caching
- Use CDN for external libraries

## Security Best Practices

- Never commit API keys or secrets
- Use Supabase Row Level Security (RLS)
- Validate all user inputs
- Sanitize data before displaying
- Use HTTPS in production
- Implement CSRF protection for forms
- Keep dependencies updated

## Accessibility

- Use semantic HTML
- Add alt text to images
- Ensure keyboard navigation
- Maintain proper heading hierarchy
- Test with screen readers
- Ensure sufficient color contrast
- Provide focus indicators

## Getting Help

- Check [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed docs
- Review [README.md](./README.md) for overview
- Check `database/README.md` for database info
- Open an issue for bugs or questions

## Code Review Process

1. All PRs require review before merging
2. Address review comments promptly
3. Keep PRs focused and reasonably sized
4. Update documentation with code changes
5. Ensure CI checks pass (if configured)

## Questions?

Feel free to open an issue or contact the maintainers.

Thank you for contributing! 🎉

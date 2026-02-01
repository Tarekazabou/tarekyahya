# Accessibility Checklist

This checklist helps ensure the Primavet website is accessible to all users, including those with disabilities.

## ♿ WCAG 2.1 Level AA Compliance

### 1. Perceivable

#### Text Alternatives
- [ ] All images have descriptive alt text
- [ ] Decorative images use empty alt (`alt=""`)
- [ ] Complex images have long descriptions
- [ ] Form inputs have associated labels
- [ ] Icons have aria-labels or sr-only text

#### Time-based Media
- [ ] Video content has captions
- [ ] Audio content has transcripts
- [ ] Auto-playing content can be paused

#### Adaptable
- [ ] Content order makes sense when CSS is disabled
- [ ] Form fields have proper labels and instructions
- [ ] Tables use proper headers and structure
- [ ] Lists use proper semantic markup

#### Distinguishable
- [ ] Color contrast ratio is at least 4.5:1 for normal text
- [ ] Color contrast ratio is at least 3:1 for large text (18pt+)
- [ ] Color is not the only means of conveying information
- [ ] Text can be resized up to 200% without loss of content
- [ ] Line height is at least 1.5x font size
- [ ] Paragraph spacing is at least 2x font size

### 2. Operable

#### Keyboard Accessible
- [x] All functionality available via keyboard
- [x] No keyboard traps
- [x] Skip navigation link present
- [ ] Focus order is logical and intuitive
- [ ] Keyboard shortcuts documented

#### Enough Time
- [ ] Time limits can be extended or disabled
- [ ] Auto-updating content can be paused
- [ ] Session timeouts are reasonable (30+ minutes)

#### Seizures and Physical Reactions
- [ ] No content flashes more than 3 times per second
- [ ] Animations respect prefers-reduced-motion

#### Navigable
- [x] Page titles are descriptive
- [x] Focus order is logical
- [x] Link text is descriptive
- [ ] Multiple ways to find content (search, sitemap, nav)
- [x] Headings are descriptive
- [x] Focus is visible

#### Input Modalities
- [ ] Touch targets are at least 44x44px
- [ ] Pointer cancellation available
- [ ] Label in name matches accessible name

### 3. Understandable

#### Readable
- [x] Page language is defined (`<html lang="fr">`)
- [ ] Language changes are marked
- [ ] Reading level is appropriate (8th grade or below)
- [ ] Unusual words are defined

#### Predictable
- [x] Navigation is consistent across pages
- [x] Components behave consistently
- [ ] Context changes only on request (not on focus)
- [ ] Forms don't auto-submit on input

#### Input Assistance
- [x] Form errors are identified
- [x] Labels and instructions provided
- [x] Error suggestions provided
- [ ] Error prevention for critical actions
- [ ] Success confirmations provided

### 4. Robust

#### Compatible
- [x] Valid HTML
- [x] Proper use of ARIA
- [x] Status messages announced
- [ ] Name, role, value available for all components

## Current Implementation Status

### ✅ Implemented
- Skip navigation functionality
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators
- Semantic HTML structure
- Form validation with error messages
- Responsive design
- Alt text on images (most)

### ⚠️ Needs Improvement
- [ ] Comprehensive alt text audit
- [ ] Color contrast verification
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Focus management in modals
- [ ] ARIA live regions for dynamic content

### ❌ Not Implemented
- [ ] Captions for video content
- [ ] Transcripts for audio
- [ ] High contrast mode
- [ ] Skip to main content link visible on focus

## Testing Tools

### Automated Testing
```bash
# Use axe-core for accessibility testing
npm install -g @axe-core/cli
axe https://your-site.com --exit
```

### Browser Extensions
- **axe DevTools** (Chrome/Firefox)
- **WAVE** (Chrome/Firefox)
- **Lighthouse** (Chrome DevTools)
- **NVDA** (Windows screen reader)
- **JAWS** (Windows screen reader - paid)
- **VoiceOver** (Mac screen reader - built-in)

### Manual Testing Checklist

#### Keyboard Navigation
1. [ ] Tab through entire page
2. [ ] Shift+Tab to go backwards
3. [ ] Enter to activate buttons/links
4. [ ] Space to toggle checkboxes
5. [ ] Arrow keys in dropdowns/menus
6. [ ] Esc to close modals

#### Screen Reader Testing
1. [ ] Navigate by headings (H key)
2. [ ] Navigate by links (K key)
3. [ ] Navigate by forms (F key)
4. [ ] Read all content in order
5. [ ] Verify ARIA labels
6. [ ] Check focus announcements

#### Zoom Testing
1. [ ] Zoom to 200%
2. [ ] Check horizontal scrolling
3. [ ] Verify content is readable
4. [ ] Test at 400% zoom

#### Color Contrast
1. [ ] Use WebAIM Contrast Checker
2. [ ] Check all text colors
3. [ ] Check hover/focus states
4. [ ] Check disabled states

## Quick Fixes

### Add Alt Text
```html
<!-- ❌ Bad -->
<img src="logo.png">

<!-- ✅ Good -->
<img src="logo.png" alt="Primavet company logo">

<!-- ✅ Decorative -->
<img src="decoration.png" alt="">
```

### Add ARIA Labels
```html
<!-- ❌ Bad -->
<button><i class="fa fa-search"></i></button>

<!-- ✅ Good -->
<button aria-label="Search">
  <i class="fa fa-search" aria-hidden="true"></i>
</button>
```

### Improve Form Labels
```html
<!-- ❌ Bad -->
<input type="text" placeholder="Name">

<!-- ✅ Good -->
<label for="name">Name</label>
<input type="text" id="name" name="name" required>
```

### Add Skip Link
```html
<body>
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
  <!-- Rest of content -->
  <main id="main-content">
    <!-- Main content here -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

### Respect Motion Preferences
```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Priority Actions

### High Priority (Do First)
1. [ ] Add/verify alt text on all images
2. [ ] Check color contrast on all text
3. [ ] Test keyboard navigation
4. [ ] Add focus indicators where missing
5. [ ] Fix form label associations

### Medium Priority (Do Next)
6. [ ] Add ARIA labels to icon buttons
7. [ ] Implement skip navigation
8. [ ] Test with screen reader
9. [ ] Add loading states with aria-live
10. [ ] Document keyboard shortcuts

### Low Priority (Nice to Have)
11. [ ] Add high contrast mode
12. [ ] Implement dark mode
13. [ ] Add tooltips with aria-describedby
14. [ ] Create accessibility statement page
15. [ ] Add keyboard shortcut legend

## Resources

### Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11Y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Windows - Free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows - Paid)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (Mac/iOS - Built-in)
- [TalkBack](https://support.google.com/accessibility/android/answer/6283677) (Android - Built-in)

## Contact

Questions about accessibility? Contact: accessibility@primavet.com

---

**Last Updated:** 2024-02-01
**Next Review:** 2024-03-01

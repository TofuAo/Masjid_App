# UI Components Usage Guide

This document provides examples and usage instructions for the new UI components added to MyMasjidApp.

## Components Added

1. **Skeleton** - Enhanced loading skeleton with multiple variants
2. **SnackBar** - Custom notification snackbar component
3. **BentoGrid** - Modern grid layout component
4. **Carousel** - Image/content carousel/slider
5. **Breadcrumbs** - Navigation breadcrumb component
6. **Accordion** - Collapsible content sections

---

## 1. Skeleton Loading

Enhanced skeleton loading component with multiple variants.

### Basic Usage

```jsx
import Skeleton from '../components/ui/Skeleton';

// Text skeleton
<Skeleton type="text" width="100%" />

// Title skeleton
<Skeleton type="title" width="60%" />

// Paragraph skeleton
<Skeleton type="paragraph" />

// Avatar skeleton
<Skeleton type="avatar" width="40px" height="40px" />

// Image skeleton
<Skeleton type="image" width="100%" height="200px" />

// Button skeleton
<Skeleton type="button" width="120px" />

// Card skeleton
<Skeleton type="card" />

// Table skeleton
<Skeleton type="table" />

// Multiple items
<Skeleton type="text" count={5} />
```

### Advanced Usage

```jsx
import Skeleton, { SkeletonGroup, SkeletonStack } from '../components/ui/Skeleton';

// Grouped skeletons
<SkeletonGroup>
  <Skeleton type="title" />
  <Skeleton type="paragraph" />
  <Skeleton type="button" />
</SkeletonGroup>

// Stacked skeletons
<SkeletonStack items={5} />
```

---

## 2. SnackBar

Custom snackbar component for notifications (alternative to react-toastify).

### Standalone Usage

```jsx
import SnackBar from '../components/ui/SnackBar';
import { useState } from 'react';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Show SnackBar</button>
      <SnackBar
        message="Operation completed successfully!"
        variant="success"
        open={open}
        onClose={() => setOpen(false)}
        duration={4000}
        position="bottom-right"
      />
    </>
  );
}
```

### Global Usage with Provider

```jsx
// In App.jsx or main entry point
import { SnackBarProvider, useSnackBar } from '../components/ui/SnackBar';

function App() {
  return (
    <SnackBarProvider>
      <YourAppContent />
    </SnackBarProvider>
  );
}

// In any component
function MyComponent() {
  const { success, error, warning, info } = useSnackBar();

  const handleClick = () => {
    success('Data saved successfully!');
    // or
    error('Failed to save data');
    // or
    warning('Please check your input');
    // or
    info('New update available');
  };

  return <button onClick={handleClick}>Show Notification</button>;
}
```

### Variants

- `success` - Green background, checkmark icon
- `error` - Red background, alert icon
- `warning` - Amber background, warning icon
- `info` - Blue background, info icon

### Positions

- `top-left`, `top-center`, `top-right`
- `bottom-left`, `bottom-center`, `bottom-right`

---

## 3. BentoGrid

Modern grid layout inspired by Apple's Bento Box design.

### Basic Usage

```jsx
import BentoGrid from '../components/ui/BentoGrid';

<BentoGrid columns={{ default: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
  <BentoGrid.Item span={{ default: 1, md: 2 }}>
    <div>Item 1 - Spans 2 columns on medium screens</div>
  </BentoGrid.Item>
  <BentoGrid.Item>
    <div>Item 2</div>
  </BentoGrid.Item>
  <BentoGrid.Item rowSpan={{ default: 1, md: 2 }}>
    <div>Item 3 - Spans 2 rows on medium screens</div>
  </BentoGrid.Item>
</BentoGrid>
```

### Advanced Usage

```jsx
<BentoGrid 
  columns={{ default: 1, sm: 2, md: 3 }} 
  gap={6}
  className="my-8"
>
  <BentoGrid.Item 
    span={{ default: 1, md: 2, lg: 3 }}
    rowSpan={{ default: 1, md: 2 }}
    asCard={true}
  >
    <h3>Featured Content</h3>
    <p>This item spans multiple columns and rows</p>
  </BentoGrid.Item>
  
  <BentoGrid.Item asCard={false}>
    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-lg">
      Custom styled item
    </div>
  </BentoGrid.Item>
</BentoGrid>
```

---

## 4. Carousel

Image/content carousel with navigation controls.

### Basic Usage

```jsx
import Carousel from '../components/ui/Carousel';
import Card from '../components/ui/Card';

<Carousel 
  autoPlay={true}
  interval={5000}
  showDots={true}
  showArrows={true}
  loop={true}
>
  <Carousel.Item>
    <Card>
      <h3>Slide 1</h3>
      <p>Content for slide 1</p>
    </Card>
  </Carousel.Item>
  <Carousel.Item>
    <Card>
      <h3>Slide 2</h3>
      <p>Content for slide 2</p>
    </Card>
  </Carousel.Item>
  <Carousel.Item>
    <Card>
      <h3>Slide 3</h3>
      <p>Content for slide 3</p>
    </Card>
  </Carousel.Item>
</Carousel>
```

### Image Carousel

```jsx
<Carousel autoPlay={true} interval={3000} showDots={true}>
  <Carousel.Item>
    <img src="/image1.jpg" alt="Image 1" className="w-full h-64 object-cover" />
  </Carousel.Item>
  <Carousel.Item>
    <img src="/image2.jpg" alt="Image 2" className="w-full h-64 object-cover" />
  </Carousel.Item>
</Carousel>
```

### Props

- `autoPlay` - Enable auto-play (default: false)
- `interval` - Auto-play interval in ms (default: 5000)
- `showDots` - Show dot indicators (default: true)
- `showArrows` - Show navigation arrows (default: true)
- `loop` - Loop through slides (default: true)
- `slidesToShow` - Number of slides to show at once (default: 1)
- `slidesToScroll` - Number of slides to scroll (default: 1)

---

## 5. Breadcrumbs

Navigation breadcrumb component.

### Basic Usage

```jsx
import Breadcrumbs, { createBreadcrumbItem } from '../components/ui/Breadcrumbs';

<Breadcrumbs 
  items={[
    createBreadcrumbItem('Kelas', '/kelas'),
    createBreadcrumbItem('Tambah Kelas')
  ]}
  showHome={true}
  homeHref="/dashboard"
  homeLabel="Dashboard"
/>
```

### Custom Separator

```jsx
<Breadcrumbs 
  items={[
    createBreadcrumbItem('Settings', '/settings'),
    createBreadcrumbItem('Profile')
  ]}
  separator="slash" // or "chevron", "dot", or custom character
/>
```

### Without Home Icon

```jsx
<Breadcrumbs 
  items={[
    createBreadcrumbItem('Page 1', '/page1'),
    createBreadcrumbItem('Page 2', '/page2'),
    createBreadcrumbItem('Current Page')
  ]}
  showHome={false}
/>
```

---

## 6. Accordion

Collapsible content sections.

### Basic Usage

```jsx
import Accordion from '../components/ui/Accordion';
import { Book, Users, Settings } from 'lucide-react';

<Accordion allowMultiple={false} defaultOpen={[0]}>
  <Accordion.Item 
    title="Frequently Asked Questions"
    icon={<Book className="w-5 h-5" />}
  >
    <p>Answer to question 1...</p>
  </Accordion.Item>
  
  <Accordion.Item title="User Guide">
    <p>User guide content...</p>
  </Accordion.Item>
  
  <Accordion.Item title="Settings">
    <p>Settings content...</p>
  </Accordion.Item>
</Accordion>
```

### Allow Multiple Open

```jsx
<Accordion allowMultiple={true}>
  <Accordion.Item title="Section 1">
    Content 1
  </Accordion.Item>
  <Accordion.Item title="Section 2">
    Content 2
  </Accordion.Item>
</Accordion>
```

### Simple Standalone Accordion

```jsx
import { SimpleAccordion } from '../components/ui/Accordion';

<SimpleAccordion 
  title="Click to expand"
  defaultOpen={false}
>
  <p>This is a standalone accordion item.</p>
</SimpleAccordion>
```

---

## Complete Example

Here's a complete example combining multiple components:

```jsx
import React, { useState } from 'react';
import Breadcrumbs, { createBreadcrumbItem } from '../components/ui/Breadcrumbs';
import BentoGrid from '../components/ui/BentoGrid';
import Carousel from '../components/ui/Carousel';
import Accordion from '../components/ui/Accordion';
import Skeleton from '../components/ui/Skeleton';
import { SnackBarProvider, useSnackBar } from '../components/ui/SnackBar';
import Card from '../components/ui/Card';

function ExamplePage() {
  const { success } = useSnackBar();
  const [loading, setLoading] = useState(true);

  return (
    <SnackBarProvider>
      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            createBreadcrumbItem('Home', '/'),
            createBreadcrumbItem('Examples')
          ]}
        />

        {/* Loading State */}
        {loading ? (
          <Skeleton type="card" count={3} />
        ) : (
          <>
            {/* Bento Grid */}
            <BentoGrid columns={{ default: 1, md: 2, lg: 3 }} gap={4}>
              <BentoGrid.Item span={{ md: 2 }}>
                <Card>
                  <h2>Featured Content</h2>
                </Card>
              </BentoGrid.Item>
              <BentoGrid.Item>
                <Card>
                  <h3>Sidebar</h3>
                </Card>
              </BentoGrid.Item>
            </BentoGrid>

            {/* Carousel */}
            <Carousel autoPlay={true} showDots={true}>
              <Carousel.Item>
                <Card>Slide 1</Card>
              </Carousel.Item>
              <Carousel.Item>
                <Card>Slide 2</Card>
              </Carousel.Item>
            </Carousel>

            {/* Accordion */}
            <Accordion>
              <Accordion.Item title="Section 1">
                Content here
              </Accordion.Item>
            </Accordion>
          </>
        )}
      </div>
    </SnackBarProvider>
  );
}
```

---

## Notes

- All components are fully responsive and follow the project's design system
- Components use TailwindCSS for styling
- All components support custom className props for additional styling
- Components are accessible with proper ARIA attributes
- All components follow the emerald/green color scheme of the mosque theme

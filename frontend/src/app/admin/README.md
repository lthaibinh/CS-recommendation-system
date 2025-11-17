# Admin Dashboard

This admin dashboard was migrated from the Flowbite Admin Dashboard Hugo template into Next.js.

## Structure

```
src/app/admin/
├── components/
│   ├── Navbar.tsx          # Top navigation bar
│   ├── Sidebar.tsx         # Left sidebar navigation
│   └── SalesChart.tsx      # ApexCharts sales chart component
├── crud/
│   ├── products/
│   │   └── page.tsx        # Products CRUD page
│   └── users/
│       └── page.tsx        # Users CRUD page
├── settings/
│   └── page.tsx            # Settings page
├── layout.tsx              # Admin layout wrapper
├── page.tsx                # Main dashboard page
└── README.md               # This file
```

## Features

### Dashboard (/)
- Sales chart with ApexCharts
- Statistics widgets
- Recent transactions
- Top products list

### CRUD Pages (/crud)
- **Products** (`/admin/crud/products`)
  - Product listing with search
  - Add/Edit/Delete functionality (UI ready)
  - Stock and price display
  - Category badges
  
- **Users** (`/admin/crud/users`)
  - User listing with search
  - Role-based badges
  - Status indicators
  - Join date tracking

### Settings (/settings)
- Profile information form
- Password change form
- Personal details management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: Flowbite + Flowbite React
- **Styling**: Tailwind CSS
- **Charts**: ApexCharts + react-apexcharts
- **Icons**: Heroicons (via Tailwind)

## Dependencies Installed

```json
{
  "flowbite": "^3.1.1",
  "flowbite-react": "latest",
  "apexcharts": "^3.46.0",
  "react-apexcharts": "latest"
}
```

## Configuration

### Tailwind Config
Updated `tailwind.config.js` to include:
- Flowbite plugin with charts support
- Flowbite content paths
- Primary color palette (blue)
- Dark mode support
- Custom font families (Inter)

### Flowbite Provider
Created `src/components/FlowbiteProvider.tsx` for:
- Flowbite initialization
- Dark mode toggle
- Sidebar mobile toggle

## Features Implemented

✅ Responsive layout with sidebar
✅ Dark mode support
✅ Mobile-friendly navigation
✅ ApexCharts integration
✅ CRUD tables with search
✅ Settings forms
✅ Dropdown menus
✅ Notification system (UI)
✅ Profile menu

## Routes

- `/admin` - Main dashboard
- `/admin/crud/products` - Products management
- `/admin/crud/users` - Users management
- `/admin/settings` - Account settings

## Customization

### Colors
The primary color can be changed in `tailwind.config.js`:
```js
colors: {
  primary: { 
    "50": "#eff6ff", 
    "100": "#dbeafe", 
    // ... more shades
  }
}
```

### Charts
Chart configuration can be modified in `src/app/admin/components/SalesChart.tsx`

### Navigation
Sidebar menu items can be edited in `src/app/admin/components/Sidebar.tsx`

## Next Steps

To make the dashboard fully functional, you may want to:
1. Connect CRUD operations to your API/database
2. Add authentication and authorization
3. Implement real data fetching
4. Add form validation
5. Implement file uploads for profile pictures
6. Add more chart types and visualizations
7. Implement notifications system
8. Add pagination logic
9. Implement search and filtering
10. Add export functionality (CSV, PDF)

## Original Template

This dashboard was based on:
- **Template**: Flowbite Admin Dashboard
- **Version**: 2.0.0
- **License**: MIT
- **Original**: Hugo static site generator template
- **Migrated to**: Next.js App Router



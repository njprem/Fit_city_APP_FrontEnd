export const getRouteByRole = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'crew':
        return '/crew';
      case 'passenger':
        return '/passenger';
      case 'maintenance':
        return '/maintenance';
      default:
        return '/';
    }
  };
  
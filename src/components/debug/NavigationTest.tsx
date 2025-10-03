import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NavigationTest() {
  const navigate = useNavigate();
  const location = useLocation();

  const testRoutes = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/people/membership', label: 'Membership List' },
    { path: '/people/membership/add', label: 'Add Member' },
    { path: '/people/configurations', label: 'People Configurations' },
    { path: '/branches', label: 'Branches' },
  ];

  const handleNavigation = (path: string) => {
    console.log(`Navigating from ${location.pathname} to ${path}`);
    navigate(path);
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Navigation Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current path: {location.pathname}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {testRoutes.map((route) => (
          <Button
            key={route.path}
            variant={location.pathname === route.path ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => handleNavigation(route.path)}
          >
            {route.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
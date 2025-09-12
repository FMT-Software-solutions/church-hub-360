import { OrganizationSelector } from '../shared/OrganizationSelector';
import { ThemeSwitcher } from '../shared/ThemeSwitcher';
import { UserProfileDropdown } from '../shared/UserProfileDropdown';

export function Header() {

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <OrganizationSelector />
        </div>

        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}

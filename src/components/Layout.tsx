import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Edit, LogIn, LogOut, Home } from 'lucide-react';

const Layout = () => {
  const { user, signOut, isLoading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container h-full flex items-center justify-between">
          <nav className="flex items-center gap-1">
            <Link to="/">
              <Button 
                variant={isActive('/') ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Главная
              </Button>
            </Link>
            
            {user && (
              <Link to="/novels">
                <Button 
                  variant={isActive('/novels') ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Мои новеллы
                </Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isLoading ? null : user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            ) : (
              <Link to="/auth">
                <Button 
                  variant={isActive('/auth') ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Войти
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
